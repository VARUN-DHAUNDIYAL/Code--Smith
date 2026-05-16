import { type NextRequest, NextResponse } from "next/server";
import { isAIEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";
export const maxDuration = 30;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface EnhancePromptRequest {
  prompt: string;
  context?: {
    fileName?: string;
    language?: string;
    codeContent?: string;
  };
}

const DEFAULT_MODEL = "codellama:latest";

function getOllamaConfig() {
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || DEFAULT_MODEL;

  return { baseUrl, model };
}

async function callOllama(prompt: string, timeoutMs: number, temperature = 0.7) {
  const { baseUrl, model } = getOllamaConfig();

  if (!baseUrl) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          top_p: 0.9,
          repeat_penalty: 1.1,
          num_predict: 1000,
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI model API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return typeof data.response === "string" ? data.response.trim() : null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function generateAIResponse(messages: ChatMessage[]): Promise<string> {
  // AI features disabled for Vercel deployment
  return "AI features are temporarily disabled for cloud deployment.";
  
  /*
  const systemPrompt = `You are an expert AI coding assistant. You help developers with:
- Code explanations and debugging
- Best practices and architecture advice
- Writing clean, efficient code
- Troubleshooting errors
- Code reviews and optimizations

Always provide clear, practical answers. When showing code, use proper Markdown code blocks with language names.`;

  const fullMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages,
  ];

  const prompt = fullMessages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n\n");

  const response = await callOllama(prompt, 25000, 0.7);

  if (response) {
    return response;
  }

  return "AI chat is not configured for this deployment yet. Set OLLAMA_BASE_URL to a reachable Ollama server, and optionally OLLAMA_MODEL, then redeploy.";
  */
}

async function enhancePrompt(request: EnhancePromptRequest): Promise<string> {
  // AI features disabled for Vercel deployment
  return request.prompt;
  
  /*
  const enhancementPrompt = `You are a prompt enhancement assistant. Take the user's basic prompt and enhance it to be more specific, detailed, and effective for a coding AI assistant.

Original prompt: "${request.prompt}"

Context: ${
    request.context ? JSON.stringify(request.context, null, 2) : "No additional context"
  }

Return only the enhanced prompt.`;

  try {
    const response = await callOllama(enhancementPrompt, 15000, 0.3);
    return response || request.prompt;
  } catch {
    return request.prompt;
  }
  */
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isAIEnabled()) {
    return NextResponse.json(
      {
        error:
          "AI features are disabled. Set NEXT_PUBLIC_ENABLE_AI=true and configure Ollama.",
      },
      { status: 503 }
    );
  }

  try {
    const body = (await req.json()) as {
      action?: string;
      message?: string;
      history?: Array<ChatMessage | unknown>;
      context?: EnhancePromptRequest["context"];
    };

    if (body.action === "enhance") {
      const enhancedPrompt = await enhancePrompt({
        prompt: typeof body.message === "string" ? body.message : "",
        context: body.context,
      });
      return NextResponse.json({ enhancedPrompt });
    }

    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required and must be a string" },
        { status: 400 }
      );
    }

    const validHistory = Array.isArray(history)
      ? history.filter(
          (entry): entry is ChatMessage =>
            Boolean(entry) &&
            typeof entry === "object" &&
            typeof (entry as ChatMessage).role === "string" &&
            typeof (entry as ChatMessage).content === "string" &&
            ["user", "assistant"].includes((entry as ChatMessage).role)
        )
      : [];

    const messages: ChatMessage[] = [
      ...validHistory.slice(-10),
      { role: "user", content: message },
    ];

    const aiResponse = await generateAIResponse(messages);
    const { model } = getOllamaConfig();

    return NextResponse.json({
      response: aiResponse,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      {
        error: "Failed to generate AI response",
        details: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  const { baseUrl, model } = getOllamaConfig();

  return NextResponse.json({
    status: "AI Chat API is running",
    configured: Boolean(baseUrl),
    model,
    timestamp: new Date().toISOString(),
  });
}
