"use client";

import { useState, useCallback } from 'react';

interface AISuggestionsState {
  suggestion: string | null;
  isLoading: boolean;
  position: { line: number; column: number } | null;
  decoration: string[];
  isEnabled: boolean;
}

interface UseAISuggestionsReturn extends AISuggestionsState {
  toggleEnabled: () => void;
  fetchSuggestion: (type: string, editor: any) => Promise<void>;
  acceptSuggestion: (editor: any, monaco: any) => void;
  rejectSuggestion: (editor: any) => void;
  clearSuggestion: (editor: any) => void;
}

export const useAISuggestions = (): UseAISuggestionsReturn => {
  const [state, setState] = useState<AISuggestionsState>({
    suggestion: null,
    isLoading: false,
    position: null,
    decoration: [],
    isEnabled: true,
  });

  const toggleEnabled = useCallback(() => {
    console.log("Toggling AI suggestions");
    setState((prev) => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const fetchSuggestion = useCallback(async (type: string, editor: any) => {
    console.log("Fetching AI suggestion...");
    console.log("AI Suggestions Enabled:", state.isEnabled);
    console.log("Editor Instance Available:", !!editor);

    if (!state.isEnabled) {
      console.warn("AI suggestions are disabled.");
      return;
    }

    if (!editor) {
      console.warn("Editor instance is not available.");
      return;
    }

    const model = editor.getModel();
    const cursorPosition = editor.getPosition();

    if (!model || !cursorPosition) {
      console.warn("Editor model or cursor position is not available.");
      return;
    }

    // Set loading state immediately
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Get context around cursor
      const lineContent = model.getLineContent(cursorPosition.lineNumber);
      const beforeCursor = lineContent.substring(0, cursorPosition.column - 1);
      const afterCursor = lineContent.substring(cursorPosition.column - 1);

      // Build context for AI
      const context = {
        beforeCursor,
        afterCursor,
        currentLine: cursorPosition.lineNumber,
        currentColumn: cursorPosition.column,
        fileContent: model.getValue(),
        language: model.getLanguageId(),
        type
      };

      // Call AI suggestion API
      const response = await fetch('/api/code-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          type,
          language: model.getLanguageId()
        }),
      });

      if (!response.ok) {
        throw new Error(`AI suggestion failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      if (data.suggestion) {
        const suggestionText = data.suggestion.trim();
        setState(prev => ({
          ...prev,
          suggestion: suggestionText,
          position: {
            line: cursorPosition.lineNumber,
            column: cursorPosition.column,
          },
          isLoading: false,
        }));
      } else {
        console.warn("No suggestion received from API.");
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error("Error fetching code suggestion:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.isEnabled]);

  const acceptSuggestion = useCallback(
    (editor: any, monaco: any) => {
      setState((currentState) => {
        if (!currentState.suggestion || !currentState.position || !editor || !monaco) {
          return currentState;
        }

        const { line, column } = currentState.position;
        const sanitizedSuggestion = currentState.suggestion.replace(/^\d+:\s*/gm, "");

        editor.executeEdits("", [
          {
            range: new monaco.Range(line, column, line, column),
            text: sanitizedSuggestion,
            forceMoveMarkers: true,
          },
        ]);

        // Clear decorations
        if (editor && currentState.decoration.length > 0) {
          editor.deltaDecorations(currentState.decoration, []);
        }

        return {
          ...currentState,
          suggestion: null,
          position: null,
          decoration: [],
        };
      });
    },
    []
  );

  const rejectSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  const clearSuggestion = useCallback((editor: any) => {
    setState((currentState) => {
      if (editor && currentState.decoration.length > 0) {
        editor.deltaDecorations(currentState.decoration, []);
      }
      return {
        ...currentState,
        suggestion: null,
        position: null,
        decoration: [],
      };
    });
  }, []);

  return {
    ...state,
    toggleEnabled,
    fetchSuggestion,
    acceptSuggestion,
    rejectSuggestion,
    clearSuggestion,
  };
};