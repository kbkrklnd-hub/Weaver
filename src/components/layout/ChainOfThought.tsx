import { useEffect, useRef } from "react";
import { Activity, BrainCircuit } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { useCotStore } from "../../store/useCotStore";

export default function ChainOfThought() {
  const { events } = useAgentStore();
  const { cotStream } = useCotStore();
  
  const feedEndRef = useRef<HTMLDivElement>(null);
  const cotEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  useEffect(() => {
    cotEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cotStream]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
  };

  const getEventStyles = (type: string) => {
    switch(type) {
      case 'router': return 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400';
      case 'security': return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
      case 'error': return 'border-rose-500/30 bg-rose-500/5 text-rose-400';
      default: return 'border-zinc-700/50 bg-zinc-800/30 text-zinc-300';
    }
  };

  return (
    <aside className="w-[340px] flex flex-col border-l border-zinc-800 bg-zinc-950 z-10 flex-shrink-0">
      <div className="flex items-center justify-between border-b border-zinc-800 p-3 bg-zinc-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <h2 className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase">System Trace</h2>
        </div>
        <div className="relative group">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 cursor-help">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono font-medium">ACTIVE</span>
          </div>
          <div className="absolute right-0 top-7 w-64 p-2.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] leading-relaxed shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
            <p className="font-semibold text-emerald-400 mb-1">Security Doctrine Active</p>
            Strict CSP enforced. IPC-only bridging enabled. Non-sandboxed network calls and unverified external telemetry are restricted.
          </div>
        </div>
      </div>

      {/* LIVE COGNITIVE STREAM */}
      {cotStream && (
        <div className="rounded border p-2 flex flex-col gap-1 border-emerald-500/40 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.05)] shrink-0 mb-2 mt-2 mx-3">
          <div className="flex items-center gap-2 opacity-80 text-[9px] mb-0.5 text-emerald-400">
            <BrainCircuit className="h-3 w-3 animate-pulse" />
            <span className="uppercase font-bold tracking-widest">Active Thought Process</span>
          </div>
          <div className="overflow-y-auto whitespace-pre-wrap text-zinc-300 leading-relaxed max-h-[150px] pr-2 text-[11px] font-mono">
            {cotStream}
            <div ref={cotEndRef} />
          </div>
        </div>
      )}

      {/* Live Chronological Event Stream */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 font-mono text-[11px]">
        {events.map((evt) => (
          <div key={evt.id} className={`rounded border p-2 flex flex-col gap-1 ${getEventStyles(evt.type)}`}>
            <div className="flex items-center justify-between opacity-60 text-[9px] mb-0.5">
              <span className="uppercase font-bold tracking-widest">[{evt.type}]</span>
              <span>{formatTime(evt.timestamp)}</span>
            </div>
            <span>{evt.message}</span>
          </div>
        ))}
        <div ref={feedEndRef} />
      </div>
    </aside>
  );
}