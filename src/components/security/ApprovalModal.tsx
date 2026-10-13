// src/components/security/ApprovalModal.tsx
import { ShieldAlert, TerminalSquare, Check, X } from "lucide-react";
import { usePluginStore } from "../../store/usePluginStore";
import { useAgentStore } from "../../store/useAgentStore";

export default function ApprovalModal() {
  const { pendingAction, installedPlugins, resolveApproval } = usePluginStore();
  const { addEvent } = useAgentStore();

  if (!pendingAction) return null;

  const plugin = installedPlugins.find(p => p.id === pendingAction.pluginId);

  const handleDecision = (approved: boolean) => {
    addEvent({
      type: 'security',
      message: `[${approved ? 'APPROVED' : 'DENIED'}] ${pendingAction.permission} request by @${pendingAction.agentName}`
    });
    resolveApproval(approved);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[500px] bg-zinc-900 border border-rose-500/50 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-rose-500/10 border-b border-rose-500/20 p-4 flex items-center gap-3">
          <ShieldAlert className="h-6 w-6 text-rose-500" />
          <div>
            <h2 className="text-rose-400 font-bold text-sm uppercase tracking-wider">Action Authorization Required</h2>
            <p className="text-xs text-zinc-400">Security gatekeeper intercepted an OS-level request.</p>
          </div>
        </div>

        {/* Details */}
        <div className="p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Requesting Agent</span>
              <p className="text-emerald-400 font-mono">@{pendingAction.agentName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Plugin Context</span>
              <p className="text-zinc-300">{plugin?.name || 'Unknown'}</p>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Requested Permission</span>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-xs">
              <TerminalSquare className="h-3 w-3 text-amber-400" />
              {pendingAction.permission}
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Payload to Execute</span>
            <div className="bg-black/50 border border-zinc-800 rounded p-3 text-zinc-300 font-mono text-xs overflow-x-auto">
              <code>{pendingAction.payload}</code>
            </div>
          </div>

          <div className="p-3 border border-amber-500/20 bg-amber-500/5 rounded-lg space-y-1.5">
            <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">Critic Assessment</span>
            <p className="text-xs text-zinc-400 leading-relaxed italic">
              "{pendingAction.criticReasoning}"
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
          <button 
            onClick={() => handleDecision(false)}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            <X className="h-4 w-4" /> DENY
          </button>
          <button 
            onClick={() => handleDecision(true)}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-bold bg-rose-500 hover:bg-rose-400 text-white transition-colors"
          >
            <Check className="h-4 w-4" /> AUTHORIZE ACTION
          </button>
        </div>

      </div>
    </div>
  );
}