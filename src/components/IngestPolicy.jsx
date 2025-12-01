import React, { useState } from 'react';
import { CloudUpload, CheckCircle, AlertCircle } from 'lucide-react';
import { ingestPolicy } from '../api';

const IngestPolicy = ({ onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    country: '',
    entity: '', // e.g. Federal, Provincial
    sector: '',
    province: '',
    text_content: ''
  });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await ingestPolicy(formData);
      setStatus('success');
      // Reset form after 2 seconds
      setTimeout(() => {
        setStatus('idle');
        setFormData({ title: '', country: '', entity: '', sector: '', province: '', text_content: '' });
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Text Content</label>
            <textarea required rows={8} className="w-full p-2 border rounded-lg font-mono text-sm"
              value={formData.text_content} onChange={e => setFormData({...formData, text_content: e.target.value})} 
              placeholder="Paste the full legal text here..." />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={status === 'loading'} 
              className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50">
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