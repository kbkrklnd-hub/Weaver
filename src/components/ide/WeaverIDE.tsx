import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { invoke } from '@tauri-apps/api/core';
import { Folder, FileCode, FileText, ChevronRight, ChevronDown, X, Save } from 'lucide-react';
import { useAgentStore } from '../../store/useAgentStore';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

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
  
  // Dropdown and layout states
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showExplorer, setShowExplorer] = useState(true);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  
  const { activeFilePath, setActiveFilePath, openFiles, addOpenFile, removeOpenFile } = useAgentStore();
  
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);

  const DEFAULT_PROJECT_PATH = "C:\\Users\\kbkla\\Projects\\Weaver";

  // Handle clicking away from dropdowns
  useEffect(() => {
    const closeMenu = () => setActiveMenu(null);
    if (activeMenu) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [activeMenu]);

const handleOpenFolder = async () => {
    try {
      // Call our custom Rust command instead of the frontend API
      const selectedPath = await invoke<string | null>('pick_workspace_dialog');
      
      if (!selectedPath) return; // User cancelled the dialog
      
      const entries = await invoke<FileEntry[]>('fs_read_tree', { path: selectedPath });
      const sorted = entries.sort((a, b) => {
        if (a.is_dir === b.is_dir) return a.name.localeCompare(b.name);
        return a.is_dir ? -1 : 1;
      });
      setRootFiles(sorted);
      
      // Close all open tabs when loading a new workspace
      openFiles.forEach(file => removeOpenFile(file.path));
    } catch (error) {
      console.error("Failed to open directory:", error);
    }
  };

  const handleSave = async () => {
    if (!activeFilePath || !editorRef.current) return;
    try {
      const currentContent = editorRef.current.getValue();
      const response = await invoke<string>('fs_write', { 
        path: activeFilePath, 
        contents: currentContent 
      });
      console.log("[Weaver] File Saved:", response); 
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  // Helper to trigger Monaco actions
  const triggerMonacoAction = (actionId: string) => {
    if (editorRef.current) {
      editorRef.current.trigger('menu', actionId, null);
      if (actionId === 'editor.action.clipboardCopyAction' || actionId === 'editor.action.clipboardCutAction') {
        editorRef.current.focus(); 
      }
    }
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: 'React.createElement',
      reactNamespace: 'React',
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
    });

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [2307, 2304, 2792] 
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, handleSave);
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
    if (!activeFilePath) {
      setEditorContent("// Select a file from the explorer to begin editing");
      return;
    }
    invoke<string>('fs_read', { path: activeFilePath })
      .then(content => setEditorContent(content))
      .catch(error => {
        console.error(`Failed to read ${activeFilePath}:`, error);
        setEditorContent(`// Error reading file: ${error}`);
      });
  }, [activeFilePath]);

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

  const handleOpenFile = (file: FileEntry) => {
    addOpenFile(file.path, file.name);
  };

  const getLanguage = (filename: string) => {
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.md')) return 'markdown';
    if (filename.endsWith('.rs')) return 'rust';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.xml')) return 'xml';
    return 'plaintext'; // Fixed the typo here!
  };

  const DropdownItem = ({ label, shortcut, onClick }: { label: string, shortcut?: string, onClick: () => void }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onClick(); setActiveMenu(null); }} 
      className="w-full text-left px-4 py-1.5 hover:bg-emerald-500/20 hover:text-emerald-400 text-zinc-300 flex justify-between items-center transition-colors"
    >
      <span>{label}</span>
      {shortcut && <span className="text-[10px] text-zinc-500 tracking-wider ml-4">{shortcut}</span>}
    </button>
  );

  return (
    <div className="flex h-full w-full bg-[#1e1e1e]">
      
      {showExplorer && (
        <div className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-950 transition-all">
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
      )}

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Action Toolbar */}
        <div className="h-8 border-b border-zinc-800 flex items-center justify-between px-3 text-xs bg-zinc-950 shrink-0">
          <div className="flex items-center space-x-2 text-zinc-400">
            
            {/* File Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'file' ? null : 'file'); }}
                className={`px-2 py-1 rounded hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${activeMenu === 'file' ? 'bg-zinc-800 text-zinc-100' : ''}`}
              >
                File
              </button>
              {activeMenu === 'file' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl py-1 z-50">
                  <DropdownItem label="New File" onClick={() => console.log("New file logic here")} />
                  <DropdownItem label="Open Folder..." onClick={() => console.log(handleOpenFolder)} />
                  <div className="h-px bg-zinc-800 my-1"></div>
                  <DropdownItem label="Save" shortcut="Ctrl+S" onClick={handleSave} />
                  <DropdownItem label="Close Editor" shortcut="Ctrl+W" onClick={() => activeFilePath && removeOpenFile(activeFilePath)} />
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'edit' ? null : 'edit'); }}
                className={`px-2 py-1 rounded hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${activeMenu === 'edit' ? 'bg-zinc-800 text-zinc-100' : ''}`}
              >
                Edit
              </button>
              {activeMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl py-1 z-50">
                  <DropdownItem label="Undo" shortcut="Ctrl+Z" onClick={() => triggerMonacoAction('undo')} />
                  <DropdownItem label="Redo" shortcut="Ctrl+Y" onClick={() => triggerMonacoAction('redo')} />
                  <div className="h-px bg-zinc-800 my-1"></div>
                  <DropdownItem label="Cut" shortcut="Ctrl+X" onClick={() => triggerMonacoAction('editor.action.clipboardCutAction')} />
                  <DropdownItem label="Copy" shortcut="Ctrl+C" onClick={() => triggerMonacoAction('editor.action.clipboardCopyAction')} />
                  <DropdownItem label="Paste" shortcut="Ctrl+V" onClick={() => triggerMonacoAction('editor.action.clipboardPasteAction')} />
                  <div className="h-px bg-zinc-800 my-1"></div>
                  <DropdownItem label="Find" shortcut="Ctrl+F" onClick={() => triggerMonacoAction('actions.find')} />
                </div>
              )}
            </div>

            {/* View Menu */}
            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === 'view' ? null : 'view'); }}
                className={`px-2 py-1 rounded hover:text-zinc-100 hover:bg-zinc-800 transition-colors ${activeMenu === 'view' ? 'bg-zinc-800 text-zinc-100' : ''}`}
              >
                View
              </button>
              {activeMenu === 'view' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl py-1 z-50">
                  <DropdownItem label="Command Palette" shortcut="Ctrl+Shift+P" onClick={() => triggerMonacoAction('editor.action.quickCommand')} />
                  <div className="h-px bg-zinc-800 my-1"></div>
                  <DropdownItem 
                    label={showExplorer ? "Hide Explorer" : "Show Explorer"} 
                    onClick={() => setShowExplorer(!showExplorer)} 
                  />
                  <DropdownItem 
                    label={wordWrap === 'on' ? "Disable Word Wrap" : "Enable Word Wrap"} 
                    onClick={() => setWordWrap(wordWrap === 'on' ? 'off' : 'on')} 
                  />
                </div>
              )}
            </div>
            
            <div className="w-px h-4 bg-zinc-800 mx-2"></div>

            <button 
              onClick={handleSave} 
              className={`flex items-center transition-colors px-2 py-1 rounded ${activeFilePath ? 'hover:text-emerald-400 hover:bg-zinc-800 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
              title="Save (Ctrl+S)"
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              <span>Save</span>
            </button>
          </div>
          
          <div className="flex items-center gap-1.5 opacity-40 select-none cursor-default">
            <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">Powered by</span>
            <span className="text-[10px] font-bold text-zinc-300">Monaco</span>
          </div>
        </div>

        {/* VS Code Style Tab Bar */}
        <div className="h-9 flex bg-zinc-950 border-b border-zinc-800 shrink-0 overflow-x-auto no-scrollbar">
          {openFiles.length === 0 ? (
            <div className="flex items-center px-4 text-xs italic text-zinc-600">No files open</div>
          ) : (
            openFiles.map((file) => (
              <div 
                key={file.path}
                onClick={() => setActiveFilePath(file.path)}
                className={`group flex items-center px-3 min-w-[120px] max-w-[200px] border-r border-zinc-800 cursor-pointer select-none ${
                  activeFilePath === file.path 
                    ? 'bg-[#1e1e1e] text-emerald-400 border-t-2 border-t-emerald-500' 
                    : 'text-zinc-500 hover:bg-zinc-900 border-t-2 border-t-transparent'
                }`}
              >
                <span className="text-xs truncate flex-1 mr-2">{file.name}</span>
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    removeOpenFile(file.path); 
                  }}
                  className={`p-0.5 rounded-md hover:bg-zinc-700/50 ${activeFilePath === file.path ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                >
                  <X className="h-3 w-3 hover:text-red-400 transition-colors" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={activeFilePath ? getLanguage(activeFilePath) : 'typescript'}
            path={activeFilePath || "untitled.tsx"}
            theme="vs-dark"
            value={editorContent}
            onChange={(val) => setEditorContent(val || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              wordWrap: wordWrap, 
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