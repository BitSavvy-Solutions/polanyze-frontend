import React, { useState } from 'react';
import { 
  Scale, 
  Search, 
  ShieldCheck, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Upload
} from 'lucide-react';
import { motion } from 'framer-motion';
import './App.css';

function App() {
  // State for the "Interactive Demo" section
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [demoResult, setDemoResult] = useState(null);

  const handleDemoSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    
    setIsAnalyzing(true);
    setDemoResult(null);
    
    // Simulate API call delay
    setTimeout(() => {
      setIsAnalyzing(false);
      setDemoResult({
        answer: "According to Section 4.2, your data may be shared with third-party affiliates, but it cannot be sold to external advertisers without explicit consent.",
        citation: "Section 4.2: Data Sharing & Privacy",
        highlight: "The Company reserves the right to share user data with affiliated partners. However, strictly no personal data shall be sold to unaffiliated third parties."
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 bg-slate-50">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gov-900 p-2 rounded-lg">
              <Scale className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gov-900">Polanyze</span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-600">
            <a href="#problem" className="hover:text-gov-600 transition-colors">The Challenge</a>
            <a href="#demo" className="hover:text-gov-600 transition-colors">Live Demo</a>
            <a href="#impact" className="hover:text-gov-600 transition-colors">G7 Impact</a>
          </div>
          <button className="bg-gov-900 text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gov-800 transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-gov-600 text-xs font-bold tracking-wide mb-6 uppercase">
              <ShieldCheck className="w-3 h-3" /> G7 GovAI Grand Challenge Entrant
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              Policy clarity,   

              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gov-600 to-gov-900">
                without the hallucination.
              </span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              We use AI to navigate complex government regulations and consumer policies. 
              We don't just generate answers; we <strong>cite the source</strong>.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#demo" className="flex items-center justify-center gap-2 bg-gov-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-gov-800 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
                Try the Prototype <ArrowRight className="w-5 h-5" />
              </a>
              <button className="px-8 py-4 rounded-xl font-bold text-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all">
                Read the Whitepaper
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- INTERACTIVE DEMO SECTION (The Core Feature) --- */}
      <section id="demo" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">See Polanyze in Action</h2>
            <p className="text-slate-600 mt-2">Upload a policy document or use our sample to ask questions.</p>
          </div>

          {/* The App Interface Mockup */}
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col md:flex-row h-[600px]">
            
            {/* LEFT: Document Viewer */}
            <div className="w-full md:w-1/2 bg-slate-100 border-r border-slate-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="w-4 h-4" /> Terms_of_Service_v2.pdf
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Indexed</span>
              </div>
              
              {/* Mock Document Content */}
              <div className="bg-white p-8 shadow-sm min-h-[500px] text-xs text-slate-500 leading-relaxed font-mono">
                <p className="mb-4">1. INTRODUCTION</p>
                <p className="mb-4">Welcome to the service. By using this platform, you agree to the following terms...</p>
                <p className="mb-4">4. DATA PRIVACY & USAGE</p>
                <p className="mb-4">4.1 Collection. We collect data necessary for the operation of the service.</p>
                
                {/* Highlighted Section Logic */}
                <div className={`transition-colors duration-500 p-1 rounded ${demoResult ? 'bg-yellow-100 border-l-4 border-yellow-400 text-slate-800' : ''}`}>
                  <p className="font-bold">4.2 Sharing with Third Parties.</p>
                  <p>The Company reserves the right to share user data with affiliated partners. However, strictly no personal data shall be sold to unaffiliated third parties.</p>
                </div>
                
                <p className="mt-4">4.3 Retention. Data is retained for 5 years...</p>
                <p className="mt-4">5. TERMINATION. We may terminate access at any time...</p>
              </div>
            </div>

            {/* RIGHT: Chat/Query Interface */}
            <div className="w-full md:w-1/2 flex flex-col">
              
              {/* Chat History */}
              <div className="flex-grow p-6 bg-white overflow-y-auto">
                {!demoResult && !isAnalyzing && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                    <Search className="w-12 h-12 mb-4 opacity-20" />
                    <p>Ask a question about the document on the left.</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button 
                        onClick={() => setQuery("Can you sell my data?")}
                        className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors"
                      >
                        "Can you sell my data?"
                      </button>
                      <button 
                        onClick={() => setQuery("What is the termination policy?")}
                        className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-full transition-colors"
                      >
                        "Termination policy?"
                      </button>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="flex flex-col items-center justify-center h-full space-y-4">
                    <div className="w-8 h-8 border-4 border-gov-200 border-t-gov-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-slate-500 animate-pulse">Analyzing semantic vectors...</p>
                  </div>
                )}

                {demoResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="bg-gov-900 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[80%] text-sm">
                        {query}
                      </div>
                    </div>

                    {/* AI Response */}
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none max-w-[90%] text-sm shadow-sm border border-slate-200">
                        <div className="flex items-center gap-2 mb-2 text-gov-700 font-bold text-xs uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4" /> Verified Answer
                        </div>
                        <p className="mb-3">{demoResult.answer}</p>
                        
                        {/* Citation Card */}
                        <div className="bg-white border border-slate-200 rounded p-3 text-xs">
                          <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                            <Search className="w-3 h-3" /> Source Found:
                          </div>
                          <p className="italic text-slate-600">"{demoResult.highlight}"</p>
                          <div className="mt-2 text-gov-600 font-medium cursor-pointer hover:underline">
                            Go to {demoResult.citation} &rarr;
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <form onSubmit={handleDemoSearch} className="relative">
                  <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a question about this policy..."
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-gov-500 focus:border-transparent outline-none shadow-sm"
                  />
                  <button 
                    type="submit"
                    className="absolute right-2 top-2 bg-gov-900 text-white p-1.5 rounded-lg hover:bg-gov-700 transition-colors"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES / RSL ALIGNMENT --- */}
      <section id="problem" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-gov-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Reduce Cognitive Load</h3>
              <p className="text-slate-600">
                Citizens are overwhelmed by legalese. We translate complex RSL #2 problem statements into plain language instantly.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-gov-600">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Zero Hallucinations</h3>
              <p className="text-slate-600">
                Unlike standard LLMs, Polanyze uses RAG (Retrieval Augmented Generation) to strictly ground answers in the provided text.
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-gov-600">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Universal Ingestion</h3>
              <p className="text-slate-600">
                Upload PDFs, XML, or paste URLs. We parse government acts and consumer policies alike.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-lg">Polanyze</span>
            </div>
            <p className="text-sm">Built for the G7 GovAI Grand Challenge 2025.</p>
          </div>
          <div className="text-sm">
            &copy; 2025 Polanyze Team. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;