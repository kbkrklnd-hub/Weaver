import { useState } from 'react';
import { Settings, Shield, Key, Puzzle, Save } from 'lucide-react';

export default function SettingsView() {
  const [activeTab, setActiveTab] = useState<'constraints' | 'keys' | 'plugins'>('constraints');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-zinc-950 text-zinc-300 p-8 overflow-y-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-3">
            <Settings className="h-6 w-6 text-emerald-500" />
            System Settings
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Global constraints, API configurations, and plugin options.</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
          <Save className="h-4 w-4" />
          Save Changes
        </button>
      </div>

      <div className="max-w-4xl flex gap-8">
        {/* Tab Navigation */}
        <div className="w-64 flex flex-col gap-2 shrink-0">
          <button 
            onClick={() => setActiveTab('constraints')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'constraints' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'}`}
          >
            <Shield className="h-4 w-4" /> Global Constraints
          </button>
          <button 
            onClick={() => setActiveTab('keys')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'keys' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'}`}
          >
            <Key className="h-4 w-4" /> API Keys
          </button>
          <button 
            onClick={() => setActiveTab('plugins')}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'plugins' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'}`}
          >
            <Puzzle className="h-4 w-4" /> Plugin Options
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 min-h-[400px]">
          {activeTab === 'constraints' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-lg font-bold text-zinc-100">Security Doctrine</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div>
                    <div className="font-bold text-zinc-200 text-sm">Human-in-the-Loop Interception</div>
                    <div className="text-xs text-zinc-500 mt-1">Require manual approval for all filesystem writes and shell executions.</div>
                  </div>
                  <div className="w-10 h-5 bg-emerald-500 rounded-full flex items-center p-1 cursor-pointer">
                    <div className="w-3 h-3 bg-zinc-950 rounded-full translate-x-5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'keys' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-lg font-bold text-zinc-100">External Provider Keys</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Tavily Search API</label>
                  <input type="password" placeholder="tvly-..." className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-300 focus:border-emerald-500 outline-none" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'plugins' && (
            <div className="animate-in fade-in space-y-6">
              <h2 className="text-lg font-bold text-zinc-100">Plugin Specific Settings</h2>
              <div className="p-8 text-center border border-dashed border-zinc-800 rounded-lg text-zinc-500 text-sm">
                Select a plugin from the sidebar to configure its isolated settings.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}