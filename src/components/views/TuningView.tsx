import { Wrench, Sparkles, Database } from 'lucide-react';

export default function TuningView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 bg-zinc-950 text-zinc-300 p-8">
      <div className="flex flex-col items-center max-w-md text-center space-y-6">
        <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
          <Wrench className="h-10 w-10" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight">Fine-Tuning Engine</h1>
          <p className="text-zinc-500 mt-2">Visual LoRA training and dataset formatting.</p>
        </div>

        <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden mt-4">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
          <h2 className="text-xl font-bold text-emerald-400 mb-2">Coming in v2.0</h2>
          <p className="text-sm text-zinc-400 mb-6">
            The native fine-tuning dashboard will integrate directly with Unsloth and Axolotl to orchestrate local training runs with zero terminal configuration.
          </p>
          
          <div className="flex items-center justify-center gap-8 text-zinc-500 font-bold tracking-widest uppercase text-xs">
            <div className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Unsloth</div>
            <div className="flex items-center gap-2"><Database className="h-4 w-4" /> Axolotl</div>
          </div>
        </div>
      </div>
    </div>
  );
}