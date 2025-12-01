import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, FileText, Globe, Building2, ArrowRight, 
  ShieldCheck, ArrowLeft, Plus, LogOut, Edit3, Save, X, UserCircle, Lock, RefreshCw, Server, Target
} from 'lucide-react';
import { searchPolicies, askDocument, ingestPolicy, fetchPolicies, fetchPolicyContent, setApiEnv } from './api';
import { useAuth } from './context/AuthContext';
import IngestPolicy from './components/IngestPolicy';

// --- LOGIN MODAL COMPONENT ---
const LoginModal = ({ onClose, onLogin }) => (
  <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-200 relative animate-in fade-in zoom-in duration-200">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
        <X size={24} />
      </button>
      <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
        <Lock className="w-8 h-8 text-blue-600" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Authentication Required</h2>
      <p className="text-slate-600 mb-8">You must be signed in to onboard new policies or edit existing regulations.</p>
      
      <button 
        onClick={onLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-all shadow-sm"
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
        Sign in with Google
      </button>
    </div>
  </div>
);

// --- DOCUMENT VIEWER COMPONENT (Handles Highlighting) ---
const DocumentViewer = ({ content, highlightText }) => {
  const containerRef = useRef(null);
  const highlightRef = useRef(null);

  // Scroll to highlight when it changes
  useEffect(() => {
    if (highlightText && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightText]);

  if (!content) return <div className="p-8 text-center text-slate-400">Loading document content...</div>;

  // Simple split logic to wrap the highlighted text
  // Note: This is a basic implementation. For complex legal texts with formatting, 
  // you might need a more robust regex approach.
  const renderContent = () => {
    if (!highlightText) return <div className="whitespace-pre-wrap font-mono text-sm text-slate-700">{content}</div>;

    // Escape special regex characters in the highlight text
    const escapedHighlight = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = content.split(new RegExp(`(${escapedHighlight})`, 'gi'));

    return (
      <div className="whitespace-pre-wrap font-mono text-sm text-slate-700">
        {parts.map((part, i) => 
          part.toLowerCase() === highlightText.toLowerCase() ? (
            <mark key={i} ref={highlightRef} className="bg-yellow-200 text-slate-900 font-bold px-1 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="h-full overflow-y-auto p-8 bg-white">
      {renderContent()}
    </div>
  );
};

function App() {
  const { user, profile, login, logout } = useAuth();
  
  // --- STATE ---
  const [view, setView] = useState('home'); 
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [currentEnv, setCurrentEnv] = useState('PROD');
  
  // Search & Data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [docs, setDocs] = useState([]); 
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Active Document State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [selectedDocContent, setSelectedDocContent] = useState(''); // Full Text
  const [activeHighlight, setActiveHighlight] = useState(''); // Text to scroll to
  const [editFormData, setEditFormData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ country: 'All', province: 'All' });

  // --- EFFECTS ---

  useEffect(() => {
    const loadPolicies = async () => {
      setIsLoadingDocs(true);
      const data = await fetchPolicies();
      setDocs(data || []);
      setIsLoadingDocs(false);
    };
    loadPolicies();
  }, [currentEnv]);

  useEffect(() => {
    if (profile) {
      setShowLoginModal(false);
    }
  }, [profile]);

  // Fetch full content when a doc is selected
  useEffect(() => {
    const loadContent = async () => {
      if (selectedDoc) {
        setSelectedDocContent(''); // Clear previous
        const content = await fetchPolicyContent(selectedDoc.id);
        setSelectedDocContent(content);
      }
    };
    loadContent();
  }, [selectedDoc]);

  // --- HANDLERS ---

  const toggleEnv = () => {
    const newEnv = currentEnv === 'PROD' ? 'LOCAL' : 'PROD';
    setApiEnv(newEnv);
    setCurrentEnv(newEnv);
    setView('home');
    alert(`Switched API to ${newEnv}`);
  };

  const handleProtectedAction = (action) => {
    if (!profile) {
      setShowLoginModal(true);
    } else {
      action();
    }
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const data = await searchPolicies(searchQuery);
      setSearchResults(data.matches || []);
    } catch (err) {
      alert("Failed to connect to backend.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocSelect = (doc) => {
    const fullDoc = docs.find(d => d.id === doc.id) || doc;
    setSelectedDoc(fullDoc);
    setChatHistory([]);
    setActiveHighlight('');
    setView('chat');
  };

  const handleEditStart = () => {
    handleProtectedAction(() => {
      setEditFormData({ 
        ...selectedDoc,
        text_content: selectedDocContent // Pre-fill with fetched content
      });
      setView('edit');
    });
  };

  const handleEditSave = async () => {
    if (!editFormData.text_content) {
      alert("Please provide the full text content to update the policy.");
      return;
    }

    setIsSaving(true);
    try {
      await ingestPolicy({
        series_id: editFormData.id, 
        title: editFormData.title,
        country: editFormData.country,
        entity: editFormData.entity,
        sector: editFormData.sector,
        province: editFormData.province || 'N/A',
        text_content: editFormData.text_content
      });

      alert("Policy update queued! It will be processed shortly.");
      const data = await fetchPolicies();
      setDocs(data);
      setView('browse');
    } catch (err) {
      console.error(err);
      alert("Failed to update policy.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const data = await askDocument(selectedDoc.id, userMsg.text);
      const analysis = data.analysis && data.analysis[0];
      let aiText = "I couldn't find relevant information.";
      let metadata = null;
      let snippet = null;

      if (analysis) {
        aiText = `Based on ${analysis.section_title}: ${analysis.text}`; // Using the chunk text as the answer for now
        snippet = analysis.text; // This is the text we want to highlight
        metadata = {
          section: analysis.section_title,
          type: analysis.legal_type,
          subject: analysis.subject,
          topics: analysis.related_topics,
          snippet: snippet // Store snippet in metadata to use for click-to-scroll
        };
      }
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText, metadata }]);
      
      // Auto-highlight if found
      if (snippet) setActiveHighlight(snippet);

    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error communicating with Knowledge Graph." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- MAIN APP ---
  const filteredDocs = docs.filter(doc => {
    if (filters.country !== 'All' && doc.country !== filters.country) return false;
    if (filters.province !== 'All' && doc.province !== filters.province) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      
      {/* LOGIN MODAL OVERLAY */}
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} onLogin={() => login()} />
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-blue-900 p-1.5 rounded">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Polanyze</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setView('browse')} className={`text-sm font-medium px-3 py-2 rounded-md ${view === 'browse' ? 'bg-slate-100 text-blue-700' : 'text-slate-600'}`}>
              Library
            </button>
            
            <button 
              onClick={() => handleProtectedAction(() => setView('ingest'))} 
              className={`text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1 ${view === 'ingest' ? 'bg-slate-100 text-blue-700' : 'text-slate-600'}`}
            >
              <Plus size={16} /> Onboard
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            {profile ? (
              <div className="flex items-center gap-3">
                <img src={profile.picture} alt="User" className="w-8 h-8 rounded-full border border-slate-200" />
                <button onClick={logout} className="text-slate-400 hover:text-red-600" title="Logout">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
              >
                <UserCircle size={18} /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 flex-1 w-full">
        
        {/* VIEW: INGEST (Protected) */}
        {view === 'ingest' && profile && (
          <IngestPolicy onCancel={() => setView('home')} />
        )}

        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                Welcome, {profile ? profile.given_name : 'Guest'}
              </h1>
              <p className="text-lg text-slate-600">
                Search across regulations. {profile ? 'Manage your policies below.' : 'Sign in to manage policies.'}
              </p>
            </div>

            <form onSubmit={handleGlobalSearch} className="relative mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-400 w-6 h-6" />
                <input 
                  type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search regulations..."
                  className="w-full pl-14 pr-4 py-4 text-lg rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 bg-blue-900 text-white px-6 rounded-lg font-medium hover:bg-blue-800">
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Results</h3>
                {searchResults.map((result, idx) => (
                  <div key={idx} onClick={() => handleDocSelect({ id: result.id, title: result.title })}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all group">
                    <h4 className="font-bold text-lg text-blue-900 group-hover:text-blue-700 mb-1">{result.title}</h4>
                    <p className="text-sm text-slate-500 line-clamp-2">"...{result.best_match_snippet}..."</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: BROWSE */}
        {view === 'browse' && (
          <div>
            <div className="flex justify-between items-end mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Policy Library</h2>
              <div className="flex gap-3">
                <select className="p-2 border rounded-lg text-sm" value={filters.country} onChange={(e) => setFilters({...filters, country: e.target.value})}>
                  <option value="All">All Countries</option>
                  <option value="Canada">Canada</option>
                  <option value="European Union">EU</option>
                </select>
              </div>
            </div>

            {isLoadingDocs ? (
              <div className="text-center py-20 text-slate-500 flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin" /> Loading policies...
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.length === 0 ? (
                  <p className="text-slate-500 col-span-3 text-center py-10">No policies found.</p>
                ) : (
                  filteredDocs.map((doc) => (
                    <div key={doc.id} onClick={() => handleDocSelect(doc)}
                      className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-blue-50 p-2 rounded-lg"><FileText className="w-6 h-6 text-blue-700" /></div>
                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{doc.entity}</span>
                      </div>
                      <h3 className="font-bold text-lg text-slate-900 mb-2">{doc.title}</h3>
                      <div className="mt-auto space-y-2 text-sm text-slate-500">
                        <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> {doc.country}</div>
                        <div className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {doc.sector || 'General'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW: EDIT (Protected) */}
        {view === 'edit' && editFormData && profile && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <Edit3 size={20} className="text-blue-600"/> Update Policy Version
              </h2>
              <div className="flex gap-2">
                <button onClick={() => setView('chat')} className="p-2 hover:bg-slate-200 rounded text-slate-600"><X size={20}/></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-sm mb-4">
                <strong>Note:</strong> Updating this policy will create a new version in the system and re-process the text for the Knowledge Graph.
              </div>
              {/* ... (Keep existing edit form inputs) ... */}
              <div>
                <label className="block text-sm font-medium mb-1">New Text Content (Paste Full Text)</label>
                <textarea 
                  required
                  rows={15} 
                  className="w-full p-2 border rounded font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={editFormData.text_content || ''} 
                  onChange={e => setEditFormData({...editFormData, text_content: e.target.value})} 
                  placeholder="Paste the updated legal text here..." 
                />
              </div>
              <div className="flex justify-end">
                <button 
                  onClick={handleEditSave} 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Processing...' : <><Save size={18} /> Update & Re-Ingest</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CHAT / DETAILS (SPLIT SCREEN) */}
        {view === 'chat' && selectedDoc && (
          <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Toolbar */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('browse')} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> {selectedDoc.title}
                </h2>
              </div>
              <button 
                onClick={handleEditStart} 
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
              >
                {profile ? <Edit3 size={16} /> : <Lock size={16} />} 
                Update Policy
              </button>
            </div>

            {/* Split Pane */}
            <div className="flex-1 flex gap-4 overflow-hidden">
              
              {/* LEFT: Document Viewer (60%) */}
              <div className="w-3/5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 uppercase">
                  Full Text Source
                </div>
                <DocumentViewer content={selectedDocContent} highlightText={activeHighlight} />
              </div>

              {/* RIGHT: Chat Interface (40%) */}
              <div className="w-2/5 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 uppercase">
                  AI Analysis
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-slate-400 mt-10">
                      <p>Ask a question to analyze specific sections.</p>
                    </div>
                  )}

                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        
                        {/* Metadata & Citation Button */}
                        {msg.metadata && (
                          <div className="mt-3 pt-3 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                              <div className="bg-slate-50 p-2 rounded"><span className="block text-slate-400 font-bold uppercase text-[10px]">Section</span><span className="font-semibold text-blue-700">{msg.metadata.section}</span></div>
                              <div className="bg-slate-50 p-2 rounded"><span className="block text-slate-400 font-bold uppercase text-[10px]">Type</span><span className="font-semibold text-slate-700">{msg.metadata.type}</span></div>
                            </div>
                            
                            {/* Click to Scroll Button */}
                            {msg.metadata.snippet && (
                              <button 
                                onClick={() => setActiveHighlight(msg.metadata.snippet)}
                                className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium py-2 rounded transition-colors"
                              >
                                <Target size={14} /> Locate in Document
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                  <form onSubmit={handleDocChat} className="relative">
                    <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask about obligations..."
                      className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                    <button type="submit" disabled={isChatting} className="absolute right-2 top-2 bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700">
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 flex justify-between items-center text-xs text-slate-400">
          <p>&copy; 2024 Polanyze. All rights reserved.</p>
          <button 
            onClick={toggleEnv} 
            className="flex items-center gap-2 hover:text-blue-600 transition-colors bg-slate-50 px-3 py-1 rounded-full border border-slate-100"
          >
            <Server size={12} />
            API: <span className={`font-bold ${currentEnv === 'LOCAL' ? 'text-green-600' : 'text-blue-600'}`}>{currentEnv}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;