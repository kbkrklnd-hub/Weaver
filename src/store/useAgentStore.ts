// v1.0.1
import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';
import { ChatMessage } from '../services/ollama';

export interface HardwareTelemetry {
  system_ram_percent_used: number;
  vram_percent_used: number;
  compute_tier: string;
  can_load_large_model: boolean;
}

export interface OpenFile {
  path: string;
  name: string;
}

export interface SystemEvent {
  id: string;
  timestamp: Date;
  type: 'router' | 'system' | 'security' | 'error';
  message: string;
}

interface AgentState {
  messages: ChatMessage[];
  events: SystemEvent[];
  isGenerating: boolean;
  activeModel: string;
  hardware: HardwareTelemetry | null;
  activeFilePath: string | null;
  openFiles: OpenFile[];
  
  addMessage: (msg: ChatMessage) => void;
  appendTokenToLast: (token: string) => void;
  setGenerating: (status: boolean) => void;
  setActiveModel: (model: string) => void;
  setActiveFilePath: (path: string | null) => void;
  addOpenFile: (path: string, name: string) => void;
  removeOpenFile: (path: string) => void;
  pollHardware: () => Promise<void>;
  addEvent: (event: Omit<SystemEvent, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  messages: [
    { role: 'system', content: 'Workspace initialized. Ready to route tasks to specialized local models.' }
  ],
  events: [
    { id: 'boot-1', timestamp: new Date(), type: 'security', message: 'Security Doctrine strictly enforced. Strict CSP active.' },
    { id: 'boot-2', timestamp: new Date(), type: 'system', message: 'IPC bridge established. Awaiting command.' }
  ],
  isGenerating: false,
  activeModel: 'llama3.1:8b', 
  hardware: null,
  activeFilePath: null,
  openFiles: [], // Added initial state
  
  clearMessages: () => set({ messages: [] }),
  
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),
  
  appendTokenToLast: (token) => set((state) => {
    const newMessages = [...state.messages];
    const lastIndex = newMessages.length - 1;
    if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
      newMessages[lastIndex] = {
        ...newMessages[lastIndex],
        content: newMessages[lastIndex].content + token
      };
    }
    return { messages: newMessages };
  }),
  
  setGenerating: (status) => set({ isGenerating: status }),
  
  setActiveModel: (model) => set((state) => {
    if (state.activeModel !== model) {
      state.addEvent({ type: 'router', message: `Dispatched pipeline to target: @${model}` });
    }
    return { activeModel: model };
  }),

  setActiveFilePath: (path) => set({ activeFilePath: path }),
  
  pollHardware: async () => {
    try {
      const telemetry = await invoke<HardwareTelemetry>('get_hardware_telemetry');
      set({ hardware: telemetry });
    } catch (error) {
      console.error("Failed to poll hardware:", error);
    }
  },

  addEvent: (event) => set((state) => ({
    events: [...state.events, { ...event, id: crypto.randomUUID(), timestamp: new Date() }]
  })),

  // Implemented multi-tab actions
  addOpenFile: (path, name) => set((state) => {
    const isAlreadyOpen = state.openFiles.some(file => file.path === path);
    if (isAlreadyOpen) {
      return { activeFilePath: path };
    }
    return { 
      openFiles: [...state.openFiles, { path, name }],
      activeFilePath: path 
    };
  }),

  removeOpenFile: (path) => set((state) => {
    const remainingFiles = state.openFiles.filter(file => file.path !== path);
    
    let newActivePath = state.activeFilePath;
    if (state.activeFilePath === path) {
      newActivePath = remainingFiles.length > 0 
        ? remainingFiles[remainingFiles.length - 1].path 
        : null;
    }

    return {
      openFiles: remainingFiles,
      activeFilePath: newActivePath
    };
  }),
}));