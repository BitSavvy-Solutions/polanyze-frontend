import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, Globe, Building2, ArrowRight, 
  Server, ShieldCheck, ChevronRight, MessageSquare, 
  ArrowLeft, MapPin, Plus, LogOut, Edit3, Save, X
} from 'lucide-react';
import { setApiEnv, searchPolicies, askDocument, updatePolicy } from './api';
import { useAuth } from './context/AuthContext';
import IngestPolicy from './components/IngestPolicy';

// Extended Mock Data to support "View Content" simulation
const MOCK_DOCS = [
  { 
    id: 'canada-federal-excise', 
    title: 'Canada Excise Tax Act 2024', 
    country: 'Canada', 
    entity: 'Federal', 
    sector: 'Finance',
    content: "PART I - INSURANCE PREMIUMS TAX\n\n4 (1) Every person shall pay to Her Majesty in right of Canada a tax in respect of..."
  },
  { 
    id: 'ontario-remote-work', 
    title: 'Ontario Remote Work Standards', 
    country: 'Canada', 
    entity: 'Provincial', 
    province: 'Ontario', 
    sector: 'Technology',
    content: "SECTION 1: DEFINITIONS\n\n'Remote work' refers to work performed from a location other than the employer's establishment..."
  },
  { 
    id: 'eu-ai-act', 
    title: 'EU AI Act (Draft)', 
    country: 'European Union', 
    entity: 'Union', 
    sector: 'Technology',
    content: "TITLE II - PROHIBITED ARTIFICIAL INTELLIGENCE PRACTICES\n\nArticle 5: The following artificial intelligence practices shall be prohibited..."
  },
];

function App() {
  const { user, profile, login, logout } = useAuth();
  
  // --- STATE ---
  const [env, setEnv] = useState('PROD');
  const [view, setView] = useState('home'); // 'home', 'browse', 'chat', 'ingest', 'edit'
  
  // Search & Data
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [docs, setDocs] = useState(MOCK_DOCS); // Local state for docs to allow editing

  // Active Document State
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Chat State
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Filters
  const [filters, setFilters] = useState({ country: 'All', province: 'All' });

  // --- HANDLERS ---

  const toggleEnv = () => {
    const newEnv = env === 'PROD' ? 'LOCAL' : 'PROD';
    setEnv(newEnv);
    setApiEnv(newEnv);
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
    // Find full doc details from our local state (simulating a GET /doc/:id)
    const fullDoc = docs.find(d => d.id === doc.id) || doc;
    setSelectedDoc(fullDoc);
    setChatHistory([]);
    setView('chat');
  };

  const handleEditStart = () => {
    setEditFormData({ ...selectedDoc });
    setView('edit');
  };

  const handleEditSave = async () => {
    // Update local state
    const updatedDocs = docs.map(d => d.id === editFormData.id ? editFormData : d);
    setDocs(updatedDocs);
    setSelectedDoc(editFormData);
    
    // Call Mock API
    await updatePolicy(editFormData.id, editFormData);
    
    setView('chat'); // Go back to view/chat mode
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

      if (analysis) {
        aiText = analysis.text;
        metadata = {
          section: analysis.section_title,
          type: analysis.legal_type,
          subject: analysis.subject,
          topics: analysis.related_topics
        };
      }
      setChatHistory(prev => [...prev, { role: 'ai', text: aiText, metadata }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error communicating with Knowledge Graph." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- LOGIN SCREEN ---
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center border border-slate-200">
          <div className="bg-blue-900 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Polanyze</h1>
          <p className="text-slate-600 mb-8">Enterprise Compliance Intelligence Platform</p>
          
          <button 
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-3 px-4 rounded-lg transition-all"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN APP ---
  const filteredDocs = docs.filter(doc => {
    if (filters.country !== 'All' && doc.country !== filters.country) return false;
    if (filters.province !== 'All' && doc.province !== filters.province) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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
            <button onClick={() => setView('ingest')} className={`text-sm font-medium px-3 py-2 rounded-md flex items-center gap-1 ${view === 'ingest' ? 'bg-slate-100 text-blue-700' : 'text-slate-600'}`}>
              <Plus size={16} /> Onboard
            </button>
            
            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <img src={profile.picture} alt="User" className="w-8 h-8 rounded-full border border-slate-200" />
              <button onClick={logout} className="text-slate-400 hover:text-red-600">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* VIEW: INGEST */}
        {view === 'ingest' && (
          <IngestPolicy onCancel={() => setView('home')} />
        )}

        {/* VIEW: HOME */}
        {view === 'home' && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                Welcome, {profile.given_name}
              </h1>
              <p className="text-lg text-slate-600">
                Search across regulations or onboard new policies.
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

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <div key={doc.id} onClick={() => handleDocSelect(doc)}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-50 p-2 rounded-lg"><FileText className="w-6 h-6 text-blue-700" /></div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">{doc.entity}</span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{doc.title}</h3>
                  <div className="mt-auto space-y-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> {doc.country}</div>
                    <div className="flex items-center gap-2"><Building2 className="w-4 h-4" /> {doc.sector}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: EDIT */}
        {view === 'edit' && editFormData && (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h2 className="font-bold text-lg">Edit Policy</h2>
              <div className="flex gap-2">
                <button onClick={() => setView('chat')} className="p-2 hover:bg-slate-200 rounded text-slate-600"><X size={20}/></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input type="text" className="w-full p-2 border rounded" value={editFormData.title} 
                    onChange={e => setEditFormData({...editFormData, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sector</label>
                  <input type="text" className="w-full p-2 border rounded" value={editFormData.sector} 
                    onChange={e => setEditFormData({...editFormData, sector: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <textarea rows={15} className="w-full p-2 border rounded font-mono text-sm" value={editFormData.content || ''} 
                  onChange={e => setEditFormData({...editFormData, content: e.target.value})} />
              </div>
              <div className="flex justify-end">
                <button onClick={handleEditSave} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: CHAT / DETAILS */}
        {view === 'chat' && selectedDoc && (
          <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setView('browse')} className="p-2 hover:bg-slate-200 rounded-full"><ArrowLeft className="w-5 h-5 text-slate-600" /></button>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" /> {selectedDoc.title}
                </h2>
              </div>
              <button onClick={handleEditStart} className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                <Edit3 size={16} /> Edit Policy
              </button>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {/* Document Preview (Snippet) */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6">
                  <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Document Content Preview</h3>
                  <p className="text-sm font-mono text-slate-600 whitespace-pre-wrap line-clamp-6">
                    {selectedDoc.content || "No content available for preview."}
                  </p>
                </div>

                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-blue-900 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      {msg.metadata && (
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-50 p-2 rounded"><span className="block text-slate-400 font-bold uppercase text-[10px]">Section</span><span className="font-semibold text-blue-700">{msg.metadata.section}</span></div>
                          <div className="bg-slate-50 p-2 rounded"><span className="block text-slate-400 font-bold uppercase text-[10px]">Type</span><span className="font-semibold text-slate-700">{msg.metadata.type}</span></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleDocChat} className="relative">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about obligations, rights, or definitions..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" />
                  <button type="submit" disabled={isChatting} className="absolute right-2 top-2 bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700">
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;