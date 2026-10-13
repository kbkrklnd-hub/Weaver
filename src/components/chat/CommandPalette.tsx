// src/components/chat/CommandPalette.tsx
import { useState, useRef, useEffect } from "react";
import { Maximize2, Minimize2, ChevronUp, ChevronDown, Terminal, Copy, ThumbsUp, ThumbsDown, RotateCcw, Square } from "lucide-react";
import { useAgentStore } from "../../store/useAgentStore";
import { usePluginStore } from "../../store/usePluginStore";
import { useCotStore } from "../../store/useCotStore";
import { streamChat, cancelGeneration } from "../../services/ollama";

interface CommandPaletteProps {
  chatState: 'collapsed' | 'normal' | 'full';
  setChatState: (state: 'collapsed' | 'normal' | 'full') => void;
}

interface CommandDef {
  trigger: string;
  description: string;
  category: 'core' | 'plugin' | 'model' | 'agent';
}

const REGISTERED_COMMANDS: CommandDef[] = [
  { trigger: '@', description: 'Hot-swap active model or agent', category: 'core' },
  { trigger: 'pi', description: 'Load a plugin namespace (e.g., ide)', category: 'core' },
  { trigger: 'exit', description: 'Exit current plugin context', category: 'core' },
  { trigger: 'clear', description: 'Clear terminal history', category: 'core' },
  { trigger: 'sys', description: 'Update base system instructions', category: 'core' }
];

const REGISTERED_MODELS: CommandDef[] = [
  { trigger: 'llama3.1:8b', description: 'Base 8B parameter model', category: 'model' },
  { trigger: 'codestral', description: 'Heavy coding & syntax model', category: 'model' },
  { trigger: 'Steve', description: 'Custom Unsloth fine-tune (GGUF)', category: 'model' },
  { trigger: 'Steve@Maxwell', description: 'Coding persona wrapped on Steve', category: 'agent' },
];

interface PaletteOption {
  text: string;
  desc: string;
  type: string;
  prefix: string;
}

export default function CommandPalette({ chatState, setChatState }: CommandPaletteProps) {
  const { 
    messages, isGenerating, activeModel, hardware, activeFilePath,
    addMessage, appendTokenToLast, setGenerating, setActiveModel, addEvent, clearMessages
  } = useAgentStore();
  
  const { installedPlugins, activePluginContext, setActiveContext } = usePluginStore();
  const { setCot, clearCot } = useCotStore();

  const [inputText, setInputText] = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<PaletteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    
    if (val.startsWith("\\")) {
      const query = val.slice(1);
      
      if (query.startsWith("@")) {
        const modelQuery = query.slice(1).toLowerCase();
        const matches = REGISTERED_MODELS.filter(m => m.trigger.toLowerCase().includes(modelQuery));
        setFilteredOptions(matches.map(m => ({ 
          text: m.trigger, desc: m.description, type: m.category, prefix: '\\@' 
        })));
      } else if (query.startsWith("pi")) {
        const pluginQuery = query.slice(2).trim().toLowerCase();
        const matches = installedPlugins.filter(p => 
          p.namespace.toLowerCase().includes(pluginQuery) || 
          p.name.toLowerCase().includes(pluginQuery)
        );
        setFilteredOptions(matches.map(p => ({ 
          text: p.namespace, desc: p.name, type: 'plugin', prefix: '\\pi ' 
        })));
      } else {
        const matches = REGISTERED_COMMANDS.filter(c => c.trigger.toLowerCase().includes(query.toLowerCase()));
        setFilteredOptions(matches.map(c => ({ 
          text: c.trigger, desc: c.description, type: c.category, prefix: '\\' 
        })));
      }
      setShowPalette(true);
      setSelectedIndex(0);
    } else {
      setShowPalette(false);
    }
  };

  const applyCommand = (option: PaletteOption) => {
    if (option.prefix === '\\' && (option.text === '@' || option.text === 'pi')) {
      const nextStr = `\\${option.text}${option.text === 'pi' ? ' ' : ''}`;
      setInputText(nextStr);
      handleInputChange({ target: { value: nextStr, style: {} } } as any); 
    } else if (option.prefix === '\\pi ') {
      setActiveContext(option.text);
      setInputText('');
      setShowPalette(false);
    } else if (option.prefix === '\\' && option.text === 'exit') {
      setActiveContext(null);
      setInputText('');
      setShowPalette(false);
    } else {
      setInputText(`${option.prefix}${option.text} `);
      setShowPalette(false);
    }
    if (inputRef.current) inputRef.current.style.height = 'auto';
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPalette && filteredOptions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredOptions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      } else if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        applyCommand(filteredOptions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowPalette(false);
      }
      return; 
    }

    if (e.key === 'Enter' && !e.shiftKey && !isGenerating) {
      e.preventDefault();
      handleSubmit();
      if (inputRef.current) inputRef.current.style.height = 'auto';
    }
  };

  const handleSubmit = async () => {
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isGenerating) return;

    let targetModel = activeModel;
    let promptContent = trimmedInput;

    const commandMatch = trimmedInput.match(/^\\@([^@\s]+)(?:@(\S+))?(?:\s+(.*))?/);
    
    if (commandMatch) {
      targetModel = commandMatch[2] ? `${commandMatch[1]}@${commandMatch[2]}` : commandMatch[1];
      promptContent = commandMatch[3] || ""; 
      setActiveModel(targetModel);
      
      if (!promptContent) {
        setInputText("");
        if (inputRef.current) inputRef.current.style.height = 'auto';
        return; 
      }
    } else if (trimmedInput.startsWith("\\")) {
      const parts = trimmedInput.split(" ");
      const cmd = parts[0].toLowerCase();

      if (cmd === "\\clear") {
        if (clearMessages) clearMessages();
        addEvent({ type: 'system', message: 'Terminal history cleared.' });
      } else if (cmd === "\\sys") {
        const sysPrompt = parts.slice(1).join(" ");
        if (sysPrompt) {
          addMessage({ role: 'system', content: `[SYSTEM OVERRIDE]: ${sysPrompt}` });
          addEvent({ type: 'system', message: 'Base system instructions updated.' });
        }
      } else {
        addEvent({ type: 'error', message: `Command ${cmd} not fully implemented.` });
      }
      
      setInputText("");
      if (inputRef.current) inputRef.current.style.height = 'auto';
      return;
    }

    const activePlugin = installedPlugins.find(p => p.namespace === activePluginContext);
    
    const userMsg = { role: "user" as const, content: promptContent };
    addMessage(userMsg);
    setInputText("");
    if (inputRef.current) inputRef.current.style.height = 'auto';
    
    const initialAssistantMsg = { role: "assistant" as const, content: "" };
    addMessage(initialAssistantMsg);
    
    setGenerating(true);

    try {
      let contextMessages = [...messages];
      
      if (activePlugin && activePlugin.getContext) {
        const pluginState = activePlugin.getContext();
        contextMessages.push({
          role: 'system',
          content: `[SYSTEM CONTEXT UPDATE]\nActive Plugin: ${activePlugin.name}\nCurrent State: ${pluginState}\nDo not acknowledge this system message directly. Use it to inform your next response.`
        });
      }

      const activeFileContext = activeFilePath 
        ? `\nCURRENT ACTIVE FILE: ${activeFilePath}` 
        : "\nNo file currently open.";

      contextMessages.push({
        role: 'system',
        content: `When executing commands or editing code, you MUST structure your response using XML tags.
1. Put your step-by-step reasoning inside <thought> tags.
2. Put your exact JSON tool call inside <action> tags. Do not put anything else inside the action tags.

Example:
<thought>
I will target line 1 of the requested file and inject the requested code.
</thought>
<action>
{"name": "edit_local_file", "parameters": {"file_path": "ABSOLUTE_PATH_HERE", "start_line": 1, "end_line": 1, "replacement_code": "new code"}}
</action>
${activeFileContext}` 
      });

      contextMessages.push(userMsg);

      clearCot();
      let responseBuffer = "";
      let isToolExecution = false;

      await streamChat(
        targetModel, 
        contextMessages, 
        { tier: hardware?.compute_tier || "standard", isBackgroundCritic: targetModel.includes("qwen") },
        (chunk) => {
          responseBuffer += chunk;
          
          if (responseBuffer.trimStart().startsWith("<")) {
            isToolExecution = true;
          }

          const thoughtMatch = responseBuffer.match(/<thought>([\s\S]*?)(?:<\/thought>|$)/);
          if (thoughtMatch) {
            setCot(thoughtMatch[1].trim());
          }

          if (!isToolExecution) {
            appendTokenToLast(chunk);
          }
        }
      );

      if (responseBuffer.includes("<action>")) {
        try {
          const actionStart = responseBuffer.indexOf('<action>') + 8;
          const actionEnd = responseBuffer.indexOf('</action>');
          
          if (actionStart > 7 && actionEnd > actionStart) {
            const jsonString = responseBuffer.substring(actionStart, actionEnd).trim();
            const toolPayload = JSON.parse(jsonString);

            if (toolPayload.name === "edit_local_file" && toolPayload.parameters) {
              window.dispatchEvent(new CustomEvent('weaver-ai-edit', {
                detail: toolPayload.parameters
              }));
              
              addEvent({ 
                type: 'system', 
                message: `Applied edits to lines ${toolPayload.parameters.start_line}-${toolPayload.parameters.end_line} in ${toolPayload.parameters.file_path.split('\\').pop()}` 
              });
            }
          }
        } catch (e) {
          console.error("Failed to parse agent action block:", e);
          addEvent({ type: 'error', message: 'Agent failed to format the action block correctly.' });
        }
      }
    } finally {
      setGenerating(false);
    }
  };

  const chatHeightClass = chatState === 'collapsed' ? 'h-12' : chatState === 'full' ? 'flex-1' : 'h-80';

  return (
    <div className={`flex flex-col border-t border-zinc-800 bg-zinc-950 transition-all duration-300 ease-in-out ${chatHeightClass}`}>
      <div className="flex items-center justify-between px-4 h-12 border-b border-zinc-800/50 flex-shrink-0">
        <div className="flex items-center gap-2 h-full">
          <div className="flex items-center gap-2 h-full px-4 border-b-2 border-emerald-500 text-emerald-400 bg-zinc-900/50">
            <Terminal className="h-4 w-4" />
            <span className="text-sm font-medium">Command Terminal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button onClick={() => setChatState(chatState === 'full' ? 'normal' : 'full')} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors">
            {chatState === 'full' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={() => setChatState(chatState === 'collapsed' ? 'normal' : 'collapsed')} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-md transition-colors">
            {chatState === 'collapsed' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {chatState !== 'collapsed' && (
        <div className="flex flex-col flex-1 min-h-0 relative">
          <div className="flex-1 p-4 overflow-y-auto text-sm space-y-4">
           {messages.map((msg, i) => (
            <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className={`text-xs font-bold ${msg.role === 'user' ? 'text-zinc-500' : 'text-emerald-500'}`}>
                {msg.role === 'user' ? 'You' : `@${activeModel}`}
              </span>
              
              {msg.content && (
                <div className="relative group max-w-[85%]">
                  <div className={`p-3 rounded-lg whitespace-pre-wrap select-text leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-zinc-800 border border-zinc-700 rounded-tr-none text-zinc-100' 
                      : 'bg-zinc-900 border border-zinc-800 rounded-tl-none text-zinc-300'
                  }`}>
                    {msg.content}
                  </div>

                  {msg.role !== 'user' && !isGenerating && (
                    <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-zinc-800/90 border border-zinc-700 backdrop-blur px-2 py-1 rounded-md shadow-lg z-10">
                      <button 
                        onClick={() => navigator.clipboard.writeText(msg.content)}
                        className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
                        title="Copy"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      
                      <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />
                      
                      <button 
                        onClick={() => console.log("RLHF: Positive Reward")}
                        className="p-1 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700 rounded transition-colors"
                        title="Good Response"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      
                      <button 
                        onClick={() => console.log("RLHF: Negative Reward")}
                        className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-700 rounded transition-colors"
                        title="Bad Response"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>

                      <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />

                      <button 
                        onClick={() => console.log("Regenerate Response")}
                        className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded transition-colors"
                        title="Regenerate"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
          
          <div className="p-4 pt-0">
            {showPalette && filteredOptions.length > 0 && (
              <div className="absolute bottom-16 left-4 w-[420px] bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-20">
                <div className="px-3 py-2 text-xs font-bold text-zinc-400 bg-zinc-900/50 border-b border-zinc-700 flex justify-between">
                  <span>
                    {inputText.startsWith('\\@') ? 'Local Targets' : 
                     inputText.startsWith('\\pi') ? 'Installed Plugins' : 'System Commands'}
                  </span>
                  <span className="text-[10px] font-normal text-zinc-500">Tab / ↵ to apply</span>
                </div>
                {filteredOptions.map((opt, idx) => (
                  <div 
                    key={opt.text}
                    className={`w-full flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors ${
                      idx === selectedIndex ? 'bg-emerald-500/20 border-l-2 border-emerald-500' : 'hover:bg-zinc-700/50 border-l-2 border-transparent'
                    }`}
                    onClick={() => applyCommand(opt)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm ${idx === selectedIndex ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {opt.prefix}{opt.text}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 px-1.5 py-0.5 rounded border border-zinc-700 bg-zinc-900">
                        {opt.type}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400 truncate ml-4 max-w-[200px]">
                      {opt.desc}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="relative flex items-center bg-zinc-900 border border-zinc-700 focus-within:border-emerald-500 rounded-lg px-3 py-2 transition-colors">
              <span className="flex items-center text-xs font-bold text-emerald-500 mr-2 shrink-0 bg-emerald-500/10 px-2 py-1 rounded select-none">
                {activePluginContext && (
                  <span className="text-zinc-300 mr-1.5">[{activePluginContext.toUpperCase()}]</span>
                )}
                @{activeModel}
              </span>
              
              <textarea 
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type \ to open command palette..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none text-zinc-100 placeholder-zinc-500 text-sm font-mono resize-none overflow-y-auto max-h-[200px] py-1 leading-relaxed"
                disabled={isGenerating}
              />

              <div className="flex items-center gap-2 ml-2">
                {isGenerating ? (
                  <button 
                    onClick={() => {
                      cancelGeneration();
                      setGenerating(false);
                      addEvent({ type: 'system', message: 'Generation halted by user.' });
                    }}
                    className="p-1.5 text-rose-500 hover:bg-rose-500/20 rounded-md transition-colors"
                    title="Stop Generation"
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                ) : (
                  <span className="text-xs font-medium px-2 py-1 text-zinc-600">
                    ↵
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}