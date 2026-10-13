import { useState } from 'react';
import { Link, useLocation } from "wouter";
import { invoke } from '@tauri-apps/api/core';
import { useAgentStore } from "../../store/useAgentStore";
import { 
  Cpu, Wrench, Settings, Power, Blocks, Code2, ChevronDown, ChevronRight
} from "lucide-react";
import { cancelGeneration } from "../../services/ollama";
import { usePluginStore } from '../../store/usePluginStore';

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { setGenerating, addEvent } = useAgentStore();
  const { installedPlugins, activePluginContext, setActiveContext } = usePluginStore();
  const [pluginsExpanded, setPluginsExpanded] = useState(true);

  const handleKillSwitch = async () => {
    try {
      cancelGeneration();
      const response = await invoke<string>('execute_kill_switch');
      setGenerating(false);
      addEvent({ type: 'security', message: `[OVERRIDE]: ${response}` });
    } catch (error) {
      addEvent({ type: 'error', message: "Kill switch execution failed." });
    }
  };

  const handleOpenIDE = () => {
    if (setActiveContext) {
      setActiveContext('ide');
    }
    setLocation('/workspace');
  };

  const NavItem = ({ href, icon: Icon, label, color = "emerald" }: { href: string; icon: any; label: string; color?: string }) => {
    const isActive = location === href || (location === "/" && href === "/workspace");
    return (
      <Link href={href}>
        <button
          className={`group flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
            isActive ? `bg-${color}-500/10 text-${color}-400` : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          }`}
          title={label}
        >
          <Icon className="h-6 w-6 stroke-[1.5] transition-transform group-hover:scale-110" />
        </button>
      </Link>
    );
  };

  const isIDEActive = (location === "/workspace" || location === "/") && activePluginContext === 'ide';

  return (
    <nav className="flex w-20 flex-col items-center justify-between border-r border-zinc-800 bg-zinc-950 py-6 z-10 flex-shrink-0">
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Logo: The Weaver 'W' */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="font-serif font-bold text-2xl tracking-tighter">W</span>
        </div>
        
        <div className="h-px w-8 bg-zinc-800" />
        
        {/* Dynamic Plugin Header */}
        <div className="flex flex-col gap-2 w-full px-3 items-center">
          <button 
            onClick={() => setPluginsExpanded(!pluginsExpanded)}
            className="group flex flex-col items-center gap-1 p-1.5 text-zinc-500 transition-all hover:text-zinc-300"
            title="Installed Plugins"
          >
            <Blocks className="h-6 w-6 group-hover:text-emerald-500 transition-colors" />
            {pluginsExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>

          {pluginsExpanded && (
            <div className="flex w-full animate-in fade-in slide-in-from-top-2 flex-col items-center gap-3 mt-2">
              {installedPlugins.filter(plugin => plugin.namespace !== 'ide').length === 0 ? (
                <div 
                  className="flex h-10 w-10 cursor-help items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 text-zinc-600" 
                  title="No external plugins found in the Weaver directory."
                >
                  <span className="text-[10px] font-bold uppercase tracking-tighter">NONE</span>
                </div>
              ) : (
                installedPlugins
                  .filter(plugin => plugin.namespace !== 'ide')
                  .map(plugin => {
                    const isActive = activePluginContext === plugin.namespace && (location === "/workspace" || location === "/");
                    return (
                      <button
                        key={plugin.namespace}
                        onClick={() => {
                          setActiveContext(isActive ? null : plugin.namespace);
                          setLocation('/workspace');
                        }}
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          isActive
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                            : 'border border-transparent text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                        }`}
                        title={plugin.name}
                      >
                        <span className="font-bold text-sm uppercase">{plugin.namespace.charAt(0)}</span>
                      </button>
                    )
                  })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Core System Tools & Hardware */}
      <div className="flex flex-col gap-4 items-center">
        <div className="h-px w-8 bg-zinc-800 mb-2" />
        
        {/* Core IDE Anchor */}
        <button
          onClick={handleOpenIDE}
          title="Weaver IDE (Monaco Workspace)"
          className={`group flex h-12 w-12 items-center justify-center rounded-xl transition-all ${
            isIDEActive ? "bg-emerald-500/10 text-emerald-400" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
          }`}
        >
          <Code2 className="h-6 w-6 stroke-[1.5] transition-transform group-hover:scale-110" />
        </button>

        <NavItem href="/models" icon={Cpu} label="Local Models" />
        <NavItem href="/tuning" icon={Wrench} label="Fine-Tuning" />
        <NavItem href="/settings" icon={Settings} label="Settings" />
        
        {/* Hardware-level Master Kill Switch */}
        <button 
          onClick={handleKillSwitch}
          className="group mt-2 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 transition-all hover:bg-rose-500 hover:text-white border border-rose-500/20"
          title="HARD STOP: Kill All Agent Processes"
        >
          <Power className="h-6 w-6 stroke-[2] transition-transform group-hover:scale-110" />
        </button>
      </div>
    </nav>
  );
}