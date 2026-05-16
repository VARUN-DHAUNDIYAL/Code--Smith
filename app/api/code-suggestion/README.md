# Code Suggestion API

This API endpoint provides code suggestions using Ollama AI with the CodeLlama model.

## Requirements

- Ollama must be running locally on http://localhost:11434
- The CodeLlama model must be installed (`ollama pull codellama`)

## API Usage

**Endpoint:** `POST /api/code-suggestion`

### Request Body

```typescript
interface CodeSuggestionRequest {
  fileContent: string;       // Full content of the file
  cursorLine: number;        // Line position of cursor (0-based)
  cursorColumn: number;      // Column position of cursor (0-based)
  suggestionType: string;    // Type of suggestion (e.g., "completion", "function", "refactor")
  fileName?: string;         // Optional file name for better language detection
}
```

### Response

```typescript
interface CodeSuggestionResponse {
  suggestion: string;        // Generated code suggestion
  context: CodeContext;      // Analysis of the code context
  metadata: {
    language: string;        // Detected programming language
    framework: string;       // Detected framework
    position: {              // Cursor position
      line: number;
      column: number;
    };
    generatedAt: string;     // ISO timestamp
  };
}
```

### Error Responses

- `400 Bad Request`: Missing or invalid input parameters
- `500 Internal Server Error`: Server-side error during processing

## Troubleshooting

If you see "AI suggestion unavailable" in the response, check that:

1. Ollama is running (`ollama serve`)
2. The CodeLlama model is installed (`ollama pull codellama`)
3. The API can connect to Ollama on http://localhost:11434
