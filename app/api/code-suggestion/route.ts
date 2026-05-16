import { type NextRequest, NextResponse } from "next/server";
import { isAIEnabled } from "@/lib/feature-flags";

export const runtime = "nodejs";
export const maxDuration = 30;

interface CodeSuggestionRequest {
  fileContent: string;
  cursorLine: number;
  cursorColumn: number;
  suggestionType: string;
  fileName?: string;
}

interface CodeContext {
  language: string;
  framework: string;
  beforeContext: string;
  currentLine: string;
  afterContext: string;
  cursorPosition: { line: number; column: number };
  isInFunction: boolean;
  isInClass: boolean;
  isAfterComment: boolean;
  incompletePatterns: string[];
}

export async function POST(request: NextRequest) {
  if (!isAIEnabled()) {
    return NextResponse.json(
      { error: "AI features are disabled. Set NEXT_PUBLIC_ENABLE_AI=true and configure Ollama." },
      { status: 503 }
    );
  }

  try {
    const body: CodeSuggestionRequest = await request.json();
    const { fileContent, cursorLine, cursorColumn, suggestionType, fileName } =
      body;

    if (!fileContent || cursorLine < 0 || cursorColumn < 0 || !suggestionType) {
      return NextResponse.json(
        { error: "Invalid input parameters" },
        { status: 400 }
      );
    }

    const context = analyzeCodeContext(
      fileContent,
      cursorLine,
      cursorColumn,
      fileName
    );
    const prompt = buildPrompt(context, suggestionType);
    const suggestion = await generateSuggestion(prompt);

    return NextResponse.json({
      suggestion,
      context,
      metadata: {
        language: context.language,
        framework: context.framework,
        position: context.cursorPosition,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    console.error("Context analysis error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal server error", message: errorMessage },
      { status: 500 }
    );
  }
}

function analyzeCodeContext(
  content: string,
  line: number,
  column: number,
  fileName?: string
): CodeContext {
  const lines = content.split("\n");
  const currentLine = lines[line] || "";
  const contextRadius = 10;
  const startLine = Math.max(0, line - contextRadius);
  const endLine = Math.min(lines.length, line + contextRadius);

  return {
    language: detectLanguage(content, fileName),
    framework: detectFramework(content),
    beforeContext: lines.slice(startLine, line).join("\n"),
    currentLine,
    afterContext: lines.slice(line + 1, endLine).join("\n"),
    cursorPosition: { line, column },
    isInFunction: detectInFunction(lines, line),
    isInClass: detectInClass(lines, line),
    isAfterComment: detectAfterComment(currentLine, column),
    incompletePatterns: detectIncompletePatterns(currentLine, column),
  };
}

function buildPrompt(context: CodeContext, suggestionType: string): string {
  return `You are an expert code completion assistant. Generate a ${suggestionType} suggestion.

Language: ${context.language}
Framework: ${context.framework}

Context:
${context.beforeContext}
${context.currentLine.substring(0, context.cursorPosition.column)}|CURSOR|${context.currentLine.substring(context.cursorPosition.column)}
${context.afterContext}

Analysis:
- In Function: ${context.isInFunction}
- In Class: ${context.isInClass}
- After Comment: ${context.isAfterComment}
- Incomplete Patterns: ${context.incompletePatterns.join(", ") || "None"}

Instructions:
1. Provide only the code that should be inserted at the cursor.
2. Maintain proper indentation and style.
3. Follow ${context.language} best practices.
4. Make the suggestion contextually appropriate.`;
}

async function generateSuggestion(prompt: string): Promise<string> {
  // AI features disabled for Vercel deployment
  return "// AI Code Suggestion is temporarily disabled.";
  
  /*
  const baseUrl = process.env.OLLAMA_BASE_URL?.replace(/\/$/, "");
  const model = process.env.OLLAMA_MODEL || "codellama:latest";

  if (!baseUrl) {
    return "// Configure OLLAMA_BASE_URL to enable AI suggestions";
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 300,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`);
    }

    const data = await response.json();
    let suggestion =
      typeof data.response === "string" ? data.response : "// No suggestion";

    if (suggestion.includes("\`\`\`")) {
      const codeMatch = suggestion.match(/\`\`\`[\w]*\n?([\s\S]*?)\`\`\`/);
      suggestion = codeMatch ? codeMatch[1].trim() : suggestion;
    }

    return suggestion.replace(/\|CURSOR\|/g, "").trim();
  } catch (error) {
    console.error("AI generation error:", error);
    return "// AI suggestion unavailable";
  }
  */
}

function detectLanguage(content: string, fileName?: string): string {
  if (fileName) {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const extMap: Record<string, string> = {
      ts: "TypeScript",
      tsx: "TypeScript",
      js: "JavaScript",
      jsx: "JavaScript",
      py: "Python",
      java: "Java",
      go: "Go",
      rs: "Rust",
      php: "PHP",
    };
    if (ext && extMap[ext]) return extMap[ext];
  }

  if (content.includes("interface ") || content.includes(": string")) {
    return "TypeScript";
  }
  if (content.includes("def ") || content.includes("import ")) return "Python";
  if (content.includes("func ") || content.includes("package ")) return "Go";

  return "JavaScript";
}

function detectFramework(content: string): string {
  if (content.includes("import React") || content.includes("useState")) {
    return "React";
  }
  if (content.includes("import Vue") || content.includes("<template>")) {
    return "Vue";
  }
  if (content.includes("@angular/") || content.includes("@Component")) {
    return "Angular";
  }
  if (content.includes("next/") || content.includes("getServerSideProps")) {
    return "Next.js";
  }

  return "None";
}

function detectInFunction(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line?.match(/^\s*(function|def|const\s+\w+\s*=|let\s+\w+\s*=)/)) {
      return true;
    }
    if (line?.match(/^\s*}/)) break;
  }
  return false;
}

function detectInClass(lines: string[], currentLine: number): boolean {
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line?.match(/^\s*(class|interface)\s+/)) return true;
  }
  return false;
}

function detectAfterComment(line: string, column: number): boolean {
  const beforeCursor = line.substring(0, column);
  return /\/\/.*$/.test(beforeCursor) || /#.*$/.test(beforeCursor);
}

function detectIncompletePatterns(line: string, column: number): string[] {
  const beforeCursor = line.substring(0, column);
  const patterns: string[] = [];

  if (/^\s*(if|while|for)\s*\($/.test(beforeCursor.trim())) {
    patterns.push("conditional");
  }
  if (/^\s*(function|def)\s*$/.test(beforeCursor.trim())) {
    patterns.push("function");
  }
  if (/\{\s*$/.test(beforeCursor)) patterns.push("object");
  if (/\[\s*$/.test(beforeCursor)) patterns.push("array");
  if (/=\s*$/.test(beforeCursor)) patterns.push("assignment");
  if (/\.\s*$/.test(beforeCursor)) patterns.push("method-call");

  return patterns;
}
