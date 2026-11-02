import { useState, useEffect } from 'react';
import { Database, Download, CheckCircle, Loader2 } from 'lucide-react';

const REQUIRED_MODELS = ['llama3.1:8b', 'codestral:latest'];
const OLLAMA_API = 'http://localhost:11434/api';

export default function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<'checking' | 'missing' | 'pulling' | 'ready'>('checking');
  const [missingModels, setMissingModels] = useState<string[]>([]);
  const [pullProgress, setPullProgress] = useState<{ model: string; pct: number } | null>(null);

  useEffect(() => {
    checkModels();
  }, []);

  const checkModels = async () => {
    try {
      const res = await fetch(`${OLLAMA_API}/tags`);
      const data = await res.json();
      const installed = data.models?.map((m: any) => m.name) || [];
      
      const missing = REQUIRED_MODELS.filter(m => !installed.includes(m));
      
      if (missing.length > 0) {
        setMissingModels(missing);
        setStatus('missing');
      } else {
        setStatus('ready');
        setTimeout(() => completeSetup(), 1000);
      }
    } catch (err) {
      console.error("Ollama connection failed", err);
      // Handle offline/Ollama-not-running state here
    }
  };

  const pullModels = async () => {
    setStatus('pulling');
    for (const model of missingModels) {
      setPullProgress({ model, pct: 0 });
      try {
        const res = await fetch(`${OLLAMA_API}/pull`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: model })
        });

        if (!res.body) continue;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value).split('\n').filter(Boolean);
          for (const line of lines) {
            const data = JSON.parse(line);
            if (data.total && data.completed) {
              setPullProgress({ model, pct: Math.round((data.completed / data.total) * 100) });
            }
          }
        }
      } catch (err) {
        console.error(`Failed to pull ${model}`, err);
      }
    }
    setStatus('ready');
    setTimeout(() => completeSetup(), 1000);
  };

  const completeSetup = () => {
    localStorage.setItem('weaver_first_boot_complete', 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm">
      <div className="w-[500px] bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Database className="h-6 w-6 text-emerald-500" />
          <h2 className="text-lg font-bold text-zinc-100">Weaver Initial Setup</h2>
        </div>

        <div className="min-h-[120px] flex flex-col justify-center gap-4">
          {status === 'checking' && (
            <div className="flex items-center gap-3 text-zinc-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Querying local Ollama engine...</span>
            </div>
          )}

          {status === 'missing' && (
            <>
              <p className="text-sm text-zinc-400">
                The following models are required for the routing engine to function deterministically:
              </p>
              <div className="flex flex-wrap gap-2">
                {missingModels.map(m => (
                  <span key={m} className="px-2 py-1 text-xs font-mono bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                    {m}
                  </span>
                ))}
              </div>
              <button 
                onClick={pullModels}
                className="mt-2 flex items-center justify-center gap-2 w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition-colors"
              >
                <Download className="h-4 w-4" />
                Download Models
              </button>
            </>
          )}

          {status === 'pulling' && pullProgress && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-zinc-400">Downloading <span className="font-mono text-zinc-200">{pullProgress.model}</span>...</span>
              <div className="w-full h-2 bg-zinc-800 rounded overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${pullProgress.pct}%` }}
                />
              </div>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex items-center gap-3 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              <span>Engine configured. Launching workspace...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}