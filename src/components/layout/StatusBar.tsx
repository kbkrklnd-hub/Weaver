import { useEffect } from "react";
import { useAgentStore } from "../../store/useAgentStore";

export default function StatusBar() {
  const { hardware, pollHardware } = useAgentStore();

  useEffect(() => {
    pollHardware();
    const interval = setInterval(pollHardware, 3000);
    return () => clearInterval(interval);
  }, [pollHardware]);

  if (!hardware) return null;

  return (
    <div className="h-6 w-full bg-zinc-950 border-t border-zinc-800 flex items-center justify-end px-4 font-mono text-[10px] text-zinc-500 gap-6 shrink-0 z-50">
      <div className="flex items-center gap-2">
        <span>SYS RAM:</span>
        <span className="text-zinc-300 font-medium">{hardware.system_ram_percent_used.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span>GPU VRAM:</span>
        <span className="text-zinc-300 font-medium">{hardware.vram_percent_used.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span>PROFILE:</span>
        <span className="text-emerald-500 font-bold uppercase tracking-wider">{hardware.compute_tier}</span>
      </div>
    </div>
  );
}