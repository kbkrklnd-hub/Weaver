import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export type WeaverPermission = 'fs:read' | 'fs:write' | 'shell:execute' | 'network:fetch';

export interface IWeaverPlugin {
  id: string;
  name: string;
  namespace: string;
  version: string;
  description: string;
  requestedPermissions: WeaverPermission[];
  entrypoint?: string;
  getContext?: () => string;
}

export interface PendingAction {
  id: string;
  pluginId: string;
  agentName: string;
  permission: WeaverPermission;
  payload: string;
  criticReasoning: string;
}

interface PluginState {
  installedPlugins: IWeaverPlugin[];
  activePluginContext: string | null;
  pendingAction: PendingAction | null; 
  
  setActiveContext: (namespace: string | null) => void;
  loadPlugins: () => Promise<void>;
  requestApproval: (action: PendingAction) => void;
  resolveApproval: (approved: boolean) => void;
}

export const usePluginStore = create<PluginState>((set, get) => ({
  installedPlugins: [],
  activePluginContext: null,
  pendingAction: null,

  setActiveContext: (namespace: string | null) => set({ activePluginContext: namespace }),

  loadPlugins: async () => {
    try {
      // TODO (Phase 7): Move this hardcoded path to a local .gitignore config file
      const pluginsBaseDir = "C:\\Users\\kbkla\\Projects\\WeaverPlugins"; 
      
      console.log(`[RUST IPC] Scanning plugin directory: ${pluginsBaseDir}`);
      const folders = await invoke<string[]>('fs_read_dir', { path: pluginsBaseDir });
      
      const loadedPlugins: IWeaverPlugin[] = [];

      for (const folder of folders) {
        try {
          const manifestPath = `${pluginsBaseDir}\\${folder}\\manifest.json`;
          const manifestRaw = await invoke<string>('fs_read', { path: manifestPath });
          const manifest = JSON.parse(manifestRaw);
          
          loadedPlugins.push({
            id: manifest.id,
            name: manifest.name,
            namespace: manifest.namespace,
            version: manifest.version,
            description: manifest.description,
            requestedPermissions: manifest.requestedPermissions,
            getContext: () => JSON.stringify({ activeFile: "main.rs", cursorLine: 42 }) 
          });
        } catch (e) {
          console.warn(`[RUST IPC] No valid manifest found in ${folder}`);
        }
      }

      if (loadedPlugins.length > 0) {
        set({ installedPlugins: loadedPlugins });
        console.log("[RUST IPC] Successfully loaded local plugins:", loadedPlugins);
      }

    } catch (error) {
      console.error("[RUST IPC] Failed to read base plugin directory:", error);
    }
  },

  requestApproval: (action) => set({ pendingAction: action }),
  
  resolveApproval: async (approved) => {
    const action = get().pendingAction;
    
    if (approved && action) {
      console.log(`[RUST IPC] Executing ${action.permission}...`);
      try {
        let result = "";
        
        switch (action.permission) {
          case 'shell:execute':
            result = await invoke('shell_execute', { payload: action.payload });
            break;
          case 'fs:write':
            const writeData = JSON.parse(action.payload);
            await invoke('fs_write', { path: writeData.path, contents: writeData.contents });
            result = `Successfully wrote to ${writeData.path}`;
            break;
          case 'fs:read':
            result = await invoke('fs_read', { path: action.payload });
            break;
          default:
            console.error("Unsupported permission execution.");
        }
        
        console.log("[RUST IPC] Success:", result);
        
      } catch (error) {
        console.error("[RUST IPC] Execution Failed:", error);
      }
    } else {
      console.log("ACTION DENIED BY USER");
    }
    
    set({ pendingAction: null });
  }
}));