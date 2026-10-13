// src/services/ollama.ts

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