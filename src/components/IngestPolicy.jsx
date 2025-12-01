import React, { useState } from 'react';
import { CloudUpload, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';
import { ingestPolicy } from '../api';

// --- PDF.js Configuration ---
import * as pdfjsLib from 'pdfjs-dist';

// 1. Import the worker directly from node_modules
// The '?url' suffix tells Vite to treat this as a static asset URL
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// 2. Set the worker source to the local file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const IngestPolicy = ({ onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    country: '',
    entity: '',
    sector: '',
    province: '',
    text_content: ''
  });
  
  const [status, setStatus] = useState('idle'); 
  const [fileName, setFileName] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setFileName(file.name);
    setStatus('extracting');

    try {
      const arrayBuffer = await file.arrayBuffer();

      // 3. Load Document with CMap support
      // We use unpkg for CMaps because they are static data files required for 
      // government docs (Standard Fonts) and don't need to be bundled.
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text items
        const pageText = textContent.items.map((item) => item.str).join(' ');
        fullText += `--- Page ${i} ---\n${pageText}\n\n`;
      }

      // Validation: Ensure we actually got text
      if (!fullText.trim() || fullText.length < 20) {
        throw new Error("PDF text extraction resulted in empty content. The PDF might be an image or protected.");
      }

      setFormData(prev => ({
        ...prev,
        text_content: fullText,
        title: prev.title || file.name.replace('.pdf', '')
      }));
      setStatus('idle');

    } catch (error) {
      console.error("PDF Extraction Details:", error);
      alert(`Extraction Failed: ${error.message}`);
      setStatus('idle');
      setFileName('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text_content) {
      alert("No text content available. Please upload a PDF or paste text.");
      return;
    }

    setStatus('loading');
    try {
      await ingestPolicy(formData);
      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ title: '', country: '', entity: '', sector: '', province: '', text_content: '' });
        setFileName('');
      }, 2000);
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <CloudUpload className="text-blue-600" /> Onboard New Policy
      </h2>

      {status === 'success' ? (
        <div className="bg-green-50 text-green-700 p-4 rounded-lg flex items-center gap-2">
          <CheckCircle /> Policy successfully queued for ingestion!
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Policy Title</label>
              <input required type="text" className="w-full p-2 border rounded-lg" 
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
              <input required type="text" className="w-full p-2 border rounded-lg" 
                value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Entity (e.g. Federal)</label>
              <input required type="text" className="w-full p-2 border rounded-lg" 
                value={formData.entity} onChange={e => setFormData({...formData, entity: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sector</label>
              <input required type="text" className="w-full p-2 border rounded-lg" 
                value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload Policy Document (PDF)</label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors relative">
              
              {status === 'extracting' ? (
                <div className="flex flex-col items-center text-blue-600">
                  <Loader2 className="animate-spin w-8 h-8 mb-2" />
                  <span className="text-sm font-medium">Extracting text from PDF...</span>
                </div>
              ) : (
                <>
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <FileText className="w-10 h-10 text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600 font-medium">
                    {fileName ? fileName : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">PDF files only (Text-based)</p>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Extracted Content <span className="text-slate-400 font-normal">(You can edit this text)</span>
            </label>
            <textarea 
              required 
              rows={8} 
              className="w-full p-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.text_content} 
              onChange={e => setFormData({...formData, text_content: e.target.value})} 
              placeholder="Uploaded PDF text will appear here..." 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button 
              type="submit" 
              disabled={status === 'loading' || status === 'extracting'} 
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 flex items-center gap-2"
            >
              {status === 'loading' && <Loader2 className="animate-spin w-4 h-4" />}
              {status === 'loading' ? 'Uploading...' : 'Ingest Policy'}
            </button>
          </div>
          {status === 'error' && <p className="text-red-600 flex items-center gap-2"><AlertCircle size={16}/> Upload failed.</p>}
        </form>
      )}
    </div>
  );
};

export default IngestPolicy;