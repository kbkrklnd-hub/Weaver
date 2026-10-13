// src/components/views/ModelsView.tsx
import { useState, useEffect } from 'react';
import { Box, Download, HardDrive, Loader2, Server, Trash2 } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';

interface OllamaModel {
  name: string;
  size: number;
  modified_at: string;
}

export default function ModelsView() {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [pullInput, setPullInput] = useState("");
  const [isPulling, setIsPulling] = useState(false);
  const [pullStatus, setPullStatus] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  
  const { addEvent } = useAgentStore();

  const fetchModels = async () => {
    try {
      const res = await fetch('http://localhost:11434/api/tags');
      if (!res.ok) throw new Error("Failed to connect to Ollama");
      const data = await res.json();
      
      // Sort models alphabetically
      const sortedModels = (data.models || []).sort((a: OllamaModel, b: OllamaModel) => 
        a.name.localeCompare(b.name)
      );
      
      setModels(sortedModels);
    } catch (e) {
      console.error(e);
      addEvent({ type: 'error', message: 'Failed to connect to local Ollama instance. Is the daemon running?' });
    } finally {
      setIsBooting(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handlePull = async () => {
    const targetModel = pullInput.trim().toLowerCase();
    if (!targetModel || isPulling) return;

    setIsPulling(true);
    setPullStatus("Contacting registry...");
    addEvent({ type: 'system', message: `Initiating download for model: ${targetModel}` });

    try {
      const res = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: targetModel })
      });

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        
        for (const line of lines) {
          const data = JSON.parse(line);
          if (data.status) {
            if (data.total && data.completed) {
               const percent = ((data.completed / data.total) * 100).toFixed(1);
               setPullStatus(`${data.status} (${percent}%)`);
            } else {
               setPullStatus(data.status);
            }
          }
        }
      }
      
      addEvent({ type: 'system', message: `Successfully installed model: ${targetModel}` });
      setPullInput("");
      await fetchModels();
    } catch (e) {
      console.error(e);
      addEvent({ type: 'error', message: `Failed to pull model: ${targetModel}` });
    } finally {
      setIsPulling(false);
      setPullStatus("");
    }
  };

  const formatBytes = (bytes: number) => {
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 text-zinc-300 p-8 overflow-y-auto">
      
      {/* View Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Server className="h-6 w-6 text-emerald-500" />
            Local Models
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Manage and provision local LLMs via the Ollama daemon.</p>
        </div>
        
        {/* Powered by Ollama Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 shadow-sm cursor-default">
          <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Powered by</span>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">Ollama</span>
        </div>
      </div>

      <div className="max-w-4xl flex flex-col gap-6">
        
        {/* Pull Model Card */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-sm font-bold text-zinc-100 mb-4 flex items-center gap-2">
            <Download className="h-4 w-4 text-emerald-500" />
            Download New Model
          </h2>
          <div className="flex gap-3">
            <input 
              type="text" 
              value={pullInput}
              onChange={(e) => setPullInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePull()}
              disabled={isPulling}
              placeholder="e.g., llama3.1:8b, qwen2.5-coder:7b" 
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
            />
            <button 
              onClick={handlePull}
              disabled={isPulling || !pullInput.trim()}
              className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-6 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPulling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {pullStatus || "Pulling..."}
                </>
              ) : (
                "Download"
              )}
            </button>
          </div>
        </div>

        {/* Installed Models Grid */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-emerald-500" />
              Installed Weights
            </h2>
            <span className="text-xs font-mono text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
              {models.length} Models Detected
            </span>
          </div>

          {isBooting ? (
            <div className="flex items-center justify-center py-12 text-zinc-500">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : models.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
              No models found. Download one above to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {models.map((model) => (
                <div key={model.name} className="flex flex-col gap-3 p-4 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-colors group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-zinc-500" />
                      <span className="font-bold text-zinc-200 text-sm">{model.name}</span>
                    </div>
                    {/* Add delete logic here later if needed */}
                    <button className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-rose-400 transition-all p-1" title="Delete Model">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                      {formatBytes(model.size)}
                    </span>
                    <span>Modified: {new Date(model.modified_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}