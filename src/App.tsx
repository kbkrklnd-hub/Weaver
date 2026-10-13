// src/App.tsx
import { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import { usePluginStore } from "./store/usePluginStore";

// Layout Components
import Sidebar from "./components/layout/Sidebar";
import ChainOfThought from "./components/layout/ChainOfThought";
import CommandPalette from "./components/chat/CommandPalette";
import WeaverIDE from "./components/ide/WeaverIDE";
import StatusBar from "./components/layout/StatusBar";

// Plugin Views
import ApprovalModal from "./components/security/ApprovalModal";
import ModelsView from "./components/views/ModelsView";
import TuningView from "./components/views/TuningView";
import SettingsView from "./components/views/SettingsView";

// The Dynamic Plugin Router
export function WorkspaceManager() {
  const { activePluginContext, installedPlugins } = usePluginStore();

  if (!activePluginContext) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center">
          <span className="text-2xl font-bold text-zinc-600">W</span>
        </div>
        <p className="font-mono text-sm">
          No active plugin context. Type <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">\pi</code> in the terminal to load a workspace.
        </p>
      </div>
    );
  }

  if (activePluginContext === 'ide') {
    return <WeaverIDE />;
  }

  const activePlugin = installedPlugins.find(p => p.namespace === activePluginContext);

  switch (activePluginContext) {
    case 'ue5':
      return (
        <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-sm">
          [UE5 Blueprint Bridge is not yet initialized]
        </div>
      );
      
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full text-zinc-500 space-y-2 font-mono text-sm">
          <p>Loaded plugin <span className="text-emerald-400">'{activePlugin?.name || activePluginContext}'</span> is active.</p>
          <p className="text-xs text-zinc-600">UI view bundle loading pending...</p>
        </div>
      );
  }
}

export default function App() {
  const [chatState, setChatState] = useState<'collapsed' | 'normal' | 'full'>('normal');
  const { loadPlugins } = usePluginStore();

  // Run once when Weaver boots to load local plugins
  useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-900 text-zinc-50 font-sans cursor-default select-none">
      
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 bg-zinc-900">
          
          <div className={`overflow-y-auto transition-all duration-300 ease-in-out ${chatState === 'full' ? 'h-0 hidden' : 'flex-1'}`}>
            <Switch>
              <Route path="/" component={WorkspaceManager} />
              <Route path="/workspace" component={WorkspaceManager} />
              <Route path="/models" component={ModelsView} />
              <Route path="/tuning" component={TuningView} />
              <Route path="/settings" component={SettingsView} />
            </Switch>
          </div>

          <CommandPalette chatState={chatState} setChatState={setChatState} />

        </main>

        <ChainOfThought />
      </div>

      <StatusBar />
      <ApprovalModal />
    </div>
  );
}