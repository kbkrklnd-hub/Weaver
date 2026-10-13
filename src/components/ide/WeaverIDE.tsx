import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { invoke } from '@tauri-apps/api/core';
import { Folder, FileCode, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';


interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

// 1. FileTreeItem is now OUTSIDE WeaverIDE! This stops the snapping.
const FileTreeItem = ({ 
  file, 
  depth = 0, 
  activeFilePath, 
  onOpenFile 
}: { 
  file: FileEntry; 
  depth?: number;
  activeFilePath: string | null;
  onOpenFile: (file: FileEntry) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const isActive = activeFilePath === file.path;

  const handleClick = async () => {
    if (!file.is_dir) {
      onOpenFile(file);
      return;
    }
    
    if (!isOpen && children.length === 0) {
      try {
        const entries = await invoke<FileEntry[]>('fs_read_tree', { path: file.path });
        const sorted = entries.sort((a, b) => {
          if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
          return a.is_dir ? -1 : 1;
        });
        setChildren(sorted);
      } catch (error) {
        console.error("Failed to load sub-directory:", error);
      }
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="flex flex-col">
      <button
        onClick={handleClick}
        style={{ paddingLeft: `${(depth * 12) + 16}px` }}
        className={`w-full flex items-center py-1.5 pr-4 text-sm transition-colors ${
          isActive 
            ? "bg-emerald-500/10 text-emerald-400" 
            : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
        }`}
      >
        <div className="w-4 mr-1 flex items-center justify-center">
          {file.is_dir && (
            isOpen ? <ChevronDown className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-500" />
          )}
        </div>

        {file.is_dir ? (
          <Folder className={`h-4 w-4 mr-2 ${isOpen ? "text-emerald-500" : "text-zinc-500"}`} />
        ) : file.name.endsWith('.tsx') || file.name.endsWith('.ts') ? (
          <FileCode className="h-4 w-4 mr-2 text-blue-400" />
        ) : (
          <FileText className="h-4 w-4 mr-2 text-zinc-500" />
        )}
        <span className="truncate">{file.name}</span>
      </button>
      
      {isOpen && children.map((child, idx) => (
        <FileTreeItem 
          key={idx} 
          file={child} 
          depth={depth + 1} 
          activeFilePath={activeFilePath}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
};

export default function WeaverIDE() {
  const [rootFiles, setRootFiles] = useState<FileEntry[]>([]);
  const [editorContent, setEditorContent] = useState<string>("// Select a file from the explorer to begin editing");
  
  // 2. Pull activeFilePath directly from the global store INSTEAD of useState
  const { activeFilePath, setActiveFilePath } = useAgentStore();
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  // TODO (Phase 7): Replace this hardcoded MVP path with a Tauri file-picker dialog
  const DEFAULT_PROJECT_PATH = "C:\\Users\\kbkla\\Projects\\Weaver";

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, async () => {
      if (!activeFilePath) return;
      try {
        const currentContent = editor.getValue();
        const response = await invoke<string>('fs_write', { 
          path: activeFilePath, 
          contents: currentContent 
        });
        console.log(response); 
      } catch (error) {
        console.error("Save failed:", error);
      }
    });
  };

  useEffect(() => {
    async function loadDirectory() {
      try {
        const entries = await invoke<FileEntry[]>('fs_read_tree', { path: DEFAULT_PROJECT_PATH });
        const sorted = entries.sort((a, b) => {
          if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
          return a.is_dir ? -1 : 1;
        });
        setRootFiles(sorted);
      } catch (error) {
        console.error("Failed to load directory:", error);
      }
    }
    loadDirectory();
  }, []);

  useEffect(() => {
    const handleAiEdit = (e: CustomEvent) => {
      if (!editorRef.current || !monacoRef.current) return;
      
      const { file_path, start_line, end_line, replacement_code } = e.detail;

      if (activeFilePath !== file_path) {
        console.warn(`[Weaver] Agent attempted to edit ${file_path}, but ${activeFilePath} is active.`);
        return;
      }

      const range = new monacoRef.current.Range(start_line, 1, end_line + 1, 1);

      editorRef.current.executeEdits("weaver-agent", [{
        range: range,
        text: replacement_code + '\n'
      }]);
      
      console.log(`[Weaver] AI edit applied to lines ${start_line}-${end_line}`);
    };

    window.addEventListener('weaver-ai-edit', handleAiEdit as EventListener);
    return () => window.removeEventListener('weaver-ai-edit', handleAiEdit as EventListener);
  }, [activeFilePath]);

  const handleOpenFile = async (file: FileEntry) => {
    try {
      const content = await invoke<string>('fs_read', { path: file.path });
      setActiveFilePath(file.path);
      setEditorContent(content);
    } catch (error) {
      console.error(`Failed to read ${file.name}:`, error);
      setEditorContent(`// Error reading file: ${error}`);
    }
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.rs')) return 'rust';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    return 'javascript';
  };

  return (
    <div className="flex h-full w-full bg-[#1e1e1e]">
      
      <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950">
        <div className="h-10 border-b border-zinc-800 flex items-center px-4 text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">
          Explorer
        </div>
        <div className="flex-1 overflow-y-auto py-2 no-scrollbar">
          {rootFiles.map((file, idx) => (
            <FileTreeItem 
              key={idx} 
              file={file} 
              depth={0} 
              activeFilePath={activeFilePath}
              onOpenFile={handleOpenFile}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Updated IDE Header with Justify-Between and Badge */}
        <div className="h-10 border-b border-zinc-800 flex items-center justify-between px-4 text-xs font-mono text-zinc-400 bg-zinc-950 shrink-0">
          <div className="flex items-center">
            <span className="text-emerald-400 mr-2 font-bold">Weaver IDE</span> 
            {activeFilePath ? `| ${activeFilePath.split('\\').pop()}` : "| Untitled-1"}
          </div>
          
          {/* Powered by Monaco Badge */}
          <div className="flex items-center gap-1.5 opacity-40 hover:opacity-100 transition-opacity select-none cursor-default">
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Powered by</span>
            <span className="text-[10px] font-bold text-zinc-300">Monaco</span>
          </div>
        </div>

        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={activeFilePath ? getLanguage(activeFilePath) : 'typescript'}
            theme="vs-dark"
            value={editorContent}
            onChange={(val) => setEditorContent(val || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              wordWrap: "on",
              padding: { top: 16 },
              scrollBeyondLastLine: false,
              smoothScrolling: true,
            }}
          />
        </div>
      </div>
      
    </div>
  );
}