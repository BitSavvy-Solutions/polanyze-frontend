import React, { useState, useEffect } from 'react';
import { 
  Search, FileText, Globe, Building2, ArrowRight, 
  Server, ShieldCheck, ChevronRight, MessageSquare, 
  ArrowLeft, Filter, MapPin
} from 'lucide-react';
import { setApiEnv, searchPolicies, askDocument } from './api';

// --- MOCK DATA FOR "BROWSE" VIEW (Until we add GET /documents endpoint) ---
const MOCK_DOCS = [
  { id: 'canada-federal-excise', title: 'Canada Excise Tax Act 2024', country: 'Canada', entity: 'Federal', sector: 'Finance' },
  { id: 'ontario-remote-work', title: 'Ontario Remote Work Standards', country: 'Canada', entity: 'Provincial', province: 'Ontario', sector: 'Technology' },
  { id: 'eu-ai-act', title: 'EU AI Act (Draft)', country: 'European Union', entity: 'Union', sector: 'Technology' }, // Future proofing example
];

function App() {
  // --- STATE ---
  const [env, setEnv] = useState('PROD'); // 'PROD' or 'LOCAL'
  const [view, setView] = useState('home'); // 'home', 'browse', 'chat'
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Chat State
  const [selectedDoc, setSelectedDoc] = useState(null);
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
      // The backend returns { matches: [...] }
      setSearchResults(data.matches || []);
    } catch (err) {
      alert("Failed to connect to backend. Check console.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDocSelect = (doc) => {
    setSelectedDoc(doc);
    setChatHistory([]); // Reset chat
    setView('chat');
  };

  const handleDocChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      // The backend returns { analysis: [...] }
      const data = await askDocument(selectedDoc.id, userMsg.text);
      
      // Format the AI response based on the Graph Ontology
      const analysis = data.analysis && data.analysis[0];
      let aiText = "I couldn't find relevant information in this document.";
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
      setChatHistory(prev => [...prev, { role: 'ai', text: "Error communicating with the Knowledge Graph." }]);
    } finally {
      setIsChatting(false);
    }
  };

  // --- RENDER HELPERS ---

  const filteredDocs = MOCK_DOCS.filter(doc => {
    if (filters.country !== 'All' && doc.country !== filters.country) return false;
    if (filters.province !== 'All' && doc.province !== filters.province) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* --- HEADER --- */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-blue-900 p-1.5 rounded">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Polanyze</span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('browse')}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors ${view === 'browse' ? 'bg-slate-100 text-blue-700' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Browse Policies
            </button>
            
            {/* Environment Toggle */}
            <button 
              onClick={toggleEnv}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                env === 'LOCAL' 
                  ? 'bg-green-50 border-green-200 text-green-700' 
                  : 'bg-blue-50 border-blue-200 text-blue-700'
              }`}
            >
              <Server className="w-3 h-3" />
              {env === 'LOCAL' ? 'Localhost:7071' : 'Azure Cloud'}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        
        {/* VIEW: HOME / SEARCH */}
        {view === 'home' && (
          <div className="max-w-3xl mx-auto mt-12">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                Compliance Intelligence for B2B
              </h1>
              <p className="text-lg text-slate-600">
                Search across Federal and Provincial regulations using our Knowledge Graph.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleGlobalSearch} className="relative mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-4 text-slate-400 w-6 h-6" />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., 'What are the tax obligations for SaaS in Ontario?'"
                  className="w-full pl-14 pr-4 py-4 text-lg rounded-xl border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button 
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-2 bottom-2 bg-blue-900 text-white px-6 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
                >
                  {isSearching ? 'Analyzing...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Relevant Documents Found</h3>
                {searchResults.map((result, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleDocSelect({ id: result.id, title: result.title })}
                    className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-lg text-blue-900 group-hover:text-blue-700 mb-1">
                          {result.title}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                          "...{result.best_match_snippet}..."
                        </p>
                        <div className="flex gap-2">
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                            Relevance: {(result.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-blue-500" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW: BROWSE */}
        {view === 'browse' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Policy Library</h2>
                <p className="text-slate-600">Browse indexed regulations by jurisdiction.</p>
              </div>
              
              {/* Filters */}
              <div className="flex gap-3">
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select 
                    className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={filters.country}
                    onChange={(e) => setFilters({...filters, country: e.target.value})}
                  >
                    <option value="All">All Countries</option>
                    <option value="Canada">Canada</option>
                    <option value="USA">USA</option>
                    <option value="European Union">European Union</option>
                  </select>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <select 
                    className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                    value={filters.province}
                    onChange={(e) => setFilters({...filters, province: e.target.value})}
                  >
                    <option value="All">All Regions</option>
                    <option value="Ontario">Ontario</option>
                    <option value="British Columbia">British Columbia</option>
                    <option value="California">California</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocs.map((doc) => (
                <div 
                  key={doc.id}
                  onClick={() => handleDocSelect(doc)}
                  className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer flex flex-col h-full"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <FileText className="w-6 h-6 text-blue-700" />
                    </div>
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded uppercase">
                      {doc.entity}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mb-2">{doc.title}</h3>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Globe className="w-4 h-4" /> {doc.country}
                    </div>
                    {doc.province && (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin className="w-4 h-4" /> {doc.province}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Building2 className="w-4 h-4" /> {doc.sector}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW: CHAT (Deep Dive) */}
        {view === 'chat' && selectedDoc && (
          <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4 flex items-center gap-4">
              <button 
                onClick={() => setView('home')}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  {selectedDoc.title}
                </h2>
                <p className="text-sm text-slate-500">Ask specific questions to extract ontology-backed answers.</p>
              </div>
            </div>

            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
                {chatHistory.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                    <p>Start analyzing this document.</p>
                  </div>
                )}
                
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-blue-900 text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      
                      {/* Ontology Metadata Card */}
                      {msg.metadata && (
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="block text-slate-400 font-bold uppercase text-[10px]">Section</span>
                              <span className="font-semibold text-blue-700">{msg.metadata.section}</span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded">
                              <span className="block text-slate-400 font-bold uppercase text-[10px]">Type</span>
                              <span className={`font-semibold ${msg.metadata.type === 'Obligation' ? 'text-red-600' : 'text-green-600'}`}>
                                {msg.metadata.type}
                              </span>
                            </div>
                            <div className="bg-slate-50 p-2 rounded col-span-2">
                              <span className="block text-slate-400 font-bold uppercase text-[10px]">Subject</span>
                              <span className="font-semibold text-slate-700">{msg.metadata.subject}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleDocChat} className="relative">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about obligations, rights, or definitions..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button 
                    type="submit"
                    disabled={isChatting}
                    className="absolute right-2 top-2 bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
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