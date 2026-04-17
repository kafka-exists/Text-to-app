```react
import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, 
  FolderDown, 
  Upload, 
  Plus, 
  Trash2, 
  Settings, 
  FileJson, 
  Check, 
  AlertCircle,
  Terminal,
  Code,
  X,
  ChevronLeft,
  Zap,
  Layout,
  RefreshCw,
  Globe
} from 'lucide-react';

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [view, setView] = useState('prompt'); 
  const [status, setStatus] = useState({ type: 'info', message: 'System Ready' });
  const [libReady, setLibReady] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadZip = async () => {
      if (window.JSZip) {
        setLibReady(true);
        return;
      }
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.async = true;
      script.onload = () => setLibReady(true);
      document.head.appendChild(script);
    };
    loadZip();
  }, []);

  const updateStatus = (type, message) => {
    setStatus({ type, message });
    if (type !== 'loading') {
      setTimeout(() => setStatus({ type: 'info', message: 'System Ready' }), 6000);
    }
  };

  const cleanJSONResponse = (text) => {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const cleaned = jsonMatch ? jsonMatch[0] : text;
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error("AI output wasn't valid JSON. Try a simpler prompt.");
    }
  };

  async function callOpenRouter(userPrompt) {
    const systemPrompt = `Return ONLY a JSON object of files for a web project. No talk. {"path": "content"}`;
    
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) throw new Error("Invalid API Key");
        if (response.status === 402) throw new Error("Insufficient Credits");
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty response from AI");
      
      return cleanJSONResponse(content);
    } catch (err) {
      if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
        throw new Error("Connection Blocked. Check your internet or API key permissions.");
      }
      throw err;
    }
  }

  const handleGenerate = async () => {
    if (!apiKey) {
      updateStatus('error', 'Enter API Key in Settings');
      setShowSettings(true);
      return;
    }
    setLoading(true);
    updateStatus('loading', 'Consulting AI Architect...');
    try {
      const generated = await callOpenRouter(prompt);
      setFiles(prev => ({ ...prev, ...generated }));
      updateStatus('success', 'Project Built!');
      setPrompt('');
      setView('files');
    } catch (err) {
      updateStatus('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!window.JSZip) return updateStatus('error', 'Zip library not ready');
    try {
      updateStatus('loading', 'Packaging Files...');
      const zip = new window.JSZip();
      Object.entries(files).forEach(([path, content]) => zip.file(path, content));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `project_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      updateStatus('success', 'ZIP Downloaded');
    } catch (err) {
      updateStatus('error', 'ZIP Failed');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-slate-300 font-sans selection:bg-indigo-500/30">
      {/* Dynamic Header */}
      <header className="px-6 py-5 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <h1 className="font-black tracking-tighter text-white text-lg">WEB_GEN</h1>
        </div>
        <button 
          onClick={() => setShowSettings(true)}
          className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-400 active:bg-white/10 transition-all"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto relative pb-32">
        {view === 'prompt' && (
          <div className="p-6 space-y-8 animate-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tighter leading-[0.9]">FAST.<br/>FLAWLESS.<br/>FILES.</h2>
              <p className="text-slate-500 text-sm font-medium">Generate complete web structures in seconds.</p>
            </div>
            
            <div className="space-y-4">
              <textarea 
                className="w-full bg-zinc-900 border border-white/10 rounded-3xl p-6 text-white min-h-[160px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-zinc-700 text-base"
                placeholder="What site should I build?"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              
              <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 disabled:opacity-20 transition-all"
              >
                {loading ? <RefreshCw size={20} className="animate-spin" /> : <Plus size={22} />}
                {loading ? "Generating..." : "Generate Project"}
              </button>

              <div className="pt-4 flex justify-center">
                <button 
                   onClick={() => fileInputRef.current.click()}
                   className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-zinc-400 transition-colors py-4 flex items-center gap-2"
                >
                  <Upload size={12} /> Or Upload Existing ZIP
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".zip" onChange={(e) => {/* same logic */}} />
              </div>
            </div>
          </div>
        )}

        {view === 'files' && (
          <div className="h-full animate-in fade-in duration-300">
            <div className="p-6 flex justify-between items-center bg-zinc-900/30 border-b border-white/5">
              <h2 className="text-xl font-black text-white uppercase tracking-tighter italic">Source</h2>
              <button 
                onClick={handleDownloadZip}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-90 shadow-lg shadow-indigo-900/40"
              >
                <FolderDown size={18} /> Get .ZIP
              </button>
            </div>
            
            <div className="p-4 space-y-2">
              {Object.keys(files).map(name => (
                <div 
                  key={name}
                  onClick={() => { setSelectedFile(name); setView('editor'); }}
                  className="flex items-center justify-between p-5 bg-zinc-900/50 rounded-2xl border border-white/5 active:bg-zinc-800 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <FileCode size={20} className="text-indigo-400" />
                    <span className="text-sm font-bold text-white truncate max-w-[180px]">{name}</span>
                  </div>
                  <ChevronLeft size={16} className="rotate-180 text-zinc-700" />
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'editor' && selectedFile && (
          <div className="absolute inset-0 bg-black flex flex-col z-20 animate-in slide-in-from-right duration-200">
            <div className="p-4 bg-zinc-950 border-b border-white/5 flex items-center gap-4">
              <button onClick={() => setView('files')} className="p-2 text-slate-400 bg-white/5 rounded-xl"><ChevronLeft size={24} /></button>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest truncate">{selectedFile}</span>
            </div>
            <textarea 
              className="flex-1 p-6 bg-black text-indigo-100 font-mono text-[13px] leading-relaxed outline-none resize-none"
              value={files[selectedFile]}
              onChange={(e) => setFiles({...files, [selectedFile]: e.target.value})}
              spellCheck={false}
            />
          </div>
        )}
      </main>

      {/* Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/5 px-8 pt-4 pb-10 flex justify-around items-center z-40">
        <button 
          onClick={() => setView('prompt')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'prompt' ? 'text-white' : 'text-zinc-600'}`}
        >
          <Plus size={28} />
          <span className="text-[8px] font-black uppercase">Create</span>
        </button>
        <button 
          onClick={() => setView('files')}
          className={`flex flex-col items-center gap-1 transition-all ${view === 'files' || view === 'editor' ? 'text-white' : 'text-zinc-600'}`}
        >
          <div className="relative">
            <Terminal size={28} />
            {Object.keys(files).length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full" />}
          </div>
          <span className="text-[8px] font-black uppercase">Files</span>
        </button>
      </nav>

      {/* Config */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-8 animate-in fade-in">
          <div className="flex justify-between items-center mb-12">
            <h3 className="text-2xl font-black uppercase italic text-white leading-none">Settings</h3>
            <button onClick={() => setShowSettings(false)} className="p-4 bg-white/5 rounded-full"><X size={24} /></button>
          </div>
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">OpenRouter API Key</label>
              <input 
                type="password"
                className="w-full h-16 bg-zinc-900 border border-white/10 rounded-2xl px-6 text-white outline-none focus:border-indigo-500 transition-all font-mono"
                placeholder="sk-or-v1-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-xs active:scale-95 transition-transform"
            >
              Save Configuration
            </button>
            <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 space-y-2">
               <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase italic">
                 <Globe size={14} /> Connection Tip
               </div>
               <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
                 If "Failed to fetch" persists, ensure your API key has "Allowed Origins" set to "*" or "all" in your OpenRouter dashboard settings.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {status.message !== 'System Ready' && (
        <div className="fixed top-24 left-6 right-6 z-[60] animate-in slide-in-from-top-4">
          <div className={`px-6 py-4 rounded-2xl border flex items-center gap-4 shadow-2xl ${
            status.type === 'success' ? 'bg-emerald-600 border-emerald-500' :
            status.type === 'error' ? 'bg-rose-600 border-rose-500' :
            'bg-indigo-600 border-indigo-500'
          }`}>
            {status.type === 'loading' ? <RefreshCw size={18} className="animate-spin" /> : <AlertCircle size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">{status.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}



