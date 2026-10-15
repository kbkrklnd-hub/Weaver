// src/services/ollama.ts v1.0.1

const OLLAMA_URL = "http://localhost:11434/api";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface StreamResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
}

interface FetchOptions {
  tier: string;
  isBackgroundCritic?: boolean;
}

/**
 * Streams a chat completion from the local Ollama instance.
 * @param model The target model (e.g., 'llama3.1:8b', 'codestral')
 * @param messages The conversation history
 * @param options Hardware profiling constraints
 * @param onChunk Callback function to update the UI as tokens stream in
 */

let activeController: AbortController | null = null;

export const cancelGeneration = () => {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
};

export interface RouteResponse {
  target: string;
}

/**
 * The Director: Analyzes a prompt and dynamically routes it to the correct specialized model.
 * Executes instantly in the background without streaming.
 */
export async function routePrompt(prompt: string): Promise<string> {
  const routerModel = "llama3.1:8b"; // The fast, lightweight Director model

  try {
    const response = await fetch(`${OLLAMA_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: routerModel,
        messages: [
          {
            role: "system",
            content: `You are the core routing agent for an IDE. Analyze the user prompt. 
            If the user asks for code generation, writing new code, or modifying existing files, return {"target": "codestral:latest"}. 
            If the user asks for general knowledge, basic chat, or file summarization, return {"target": "llama3.1:8b"}. 
            If the user asks for code review, debugging, or critique, return {"target": "qwen2.5-coder:7b"}. 
            Output strictly valid JSON and nothing else.`
          },
          { role: "user", content: prompt }
        ],
        stream: false, // We want the full JSON object at once, no streaming
        format: "json", // Force Ollama to validate the output as JSON
        options: {
          keep_alive: "15m", // Keep the router warm for quick consecutive queries
          num_ctx: 2048,     // Keep context small for speed
          temperature: 0.1   // Low temp for highly deterministic routing
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Router API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parsed: RouteResponse = JSON.parse(data.message.content);
    
    // Safety net: if the router hallucinates a weird model name, fallback to base
    const validModels = ["codestral:latest", "llama3.1:8b", "qwen2.5-coder:7b", "codestral"];
    if (validModels.includes(parsed.target)) {
      return parsed.target;
    }
    
    console.warn(`[Router] Invalid target generated: ${parsed.target}. Defaulting to base model.`);
    return routerModel;
    
  } catch (error) {
    console.error("[Router] Routing failed, defaulting to base model:", error);
    return routerModel;
  }
}

export async function streamChat(
  model: string,
  messages: ChatMessage[],
  options: FetchOptions,
  onChunk: (chunk: string) => void
): Promise<void> {
  // 1. Assign a new controller every time a stream starts
  activeController = new AbortController();

  // Dynamically allocate resources based on the abstracted hardware tier
  let keepAlive = "0m";
  let numCtx = 2048;

  if (options.tier === "enthusiast") {
    keepAlive = options.isBackgroundCritic ? "5m" : "45m";
    numCtx = options.isBackgroundCritic ? 4096 : 32768; 
  } else if (options.tier === "standard") {
    keepAlive = options.isBackgroundCritic ? "0m" : "15m";
    numCtx = options.isBackgroundCritic ? 2048 : 8192;
  }

  try {
    const response = await fetch(`${OLLAMA_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
          keep_alive: keepAlive,
          num_ctx: numCtx
        }
      }),
      signal: activeController.signal // 2. Attach the kill switch signal here!
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    if (!response.body) throw new Error("No response body returned from Ollama.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        try {
          const parsed: StreamResponse = JSON.parse(line);
          if (parsed.message?.content) {
            onChunk(parsed.message.content);
          }
        } catch (e) {
          console.warn("Failed to parse chunk:", line);
        }
      }
    }
  } catch (error: any) {
    // 3. Catch the specific AbortError so it doesn't crash or print an API error when killed
    if (error.name === 'AbortError') {
      console.log("Stream forcefully aborted by Kill Switch.");
    } else {
      console.error("Failed to connect to local Ollama instance:", error);
      onChunk("\n\n[SYSTEM ERROR]: Connection to Ollama failed. Verify the engine is running.");
    }
  } finally {
    // 4. Clean up when the stream finishes naturally or is killed
    activeController = null;
  }
}