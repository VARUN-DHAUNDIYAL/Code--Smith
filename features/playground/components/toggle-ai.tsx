"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Code, 
  FileText, 
  Import, 
  Loader2,
  Power,
  PowerOff,
  Braces,
  Variable
} from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";
import { AIChatSidePanel } from "@/features/ai-chat/components/ai-chat-sidepanel";
import { toast } from "sonner";


interface ToggleAIProps {
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  
  suggestionLoading: boolean;
  loadingProgress?: number;
  activeFeature?: string;
  
  // AI integration props
  onInsertCode?: (code: string, fileId: string, position?: { line: number; column: number }) => void;
  onRunCode?: (code: string, language: string) => Promise<void>;
  
  // File context props
  openFiles?: Array<{ 
    id: string; 
    filename: string; 
    fileExtension: string;
    content?: string;
    cursorPosition?: { line: number; column: number };
  }>;
  activeFileId?: string | null;
}

const ToggleAI: React.FC<ToggleAIProps> = ({
  isEnabled,
  onToggle,
  suggestionLoading,
  loadingProgress = 0,
  activeFeature,
  onInsertCode,
  onRunCode,
  openFiles,
  activeFileId,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Real handler for code insertion from AI chat panel
  const handleInsertCode = useCallback((code: string, fileName?: string, position?: { line: number; column: number }) => {
    if (!onInsertCode) {
      console.warn("onInsertCode handler not provided");
      return;
    }

    try {
      // If fileName is provided, try to find the file in open files
      if (fileName) {
        const targetFile = openFiles?.find(f => f.filename === fileName);
        if (targetFile) {
          onInsertCode(code, targetFile.id, position);
          toast.success(`Code inserted into ${fileName}`);
          return;
        }
      }

      // If no specific file or file not found, insert into active file
      if (activeFileId) {
        onInsertCode(code, activeFileId, position);
        toast.success("Code inserted into active file");
        return;
      }

      toast.error("No active file to insert code into");
    } catch (error) {
      console.error("Error inserting code:", error);
      toast.error("Failed to insert code");
    }
  }, [onInsertCode, openFiles, activeFileId]);

  // Real handler for running code from AI chat panel
  const handleRunCode = useCallback(async (code: string, language: string) => {
    if (!onRunCode) {
      console.warn("onRunCode handler not provided");
      return;
    }

    try {
      // Create a temporary file with the code
      const tempFileName = `temp_${Date.now()}.${getFileExtension(language)}`;
      
      // Run the code
      await onRunCode(code, language);
      toast.success(`Code executed successfully`);
    } catch (error) {
      console.error("Error running code:", error);
      toast.error("Failed to run code");
    }
  }, [onRunCode]);

  // Helper function to get file extension from language
  const getFileExtension = (language: string): string => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      sql: 'sql',
      php: 'php',
      ruby: 'rb',
      go: 'go',
      rust: 'rs',
      swift: 'swift',
      kotlin: 'kt'
    };
    return extensions[language.toLowerCase()] || 'txt';
  };

  // Get active file and cursor position from context
  const activeFile = openFiles?.find(f => f.id === activeFileId);
  const cursorPosition = activeFile?.cursorPosition || { line: 1, column: 1 };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            size="sm" 
            variant={isEnabled ? "default" : "outline"}
            className={cn(
              "relative gap-2 h-8 px-3 text-sm font-medium transition-all duration-200",
              isEnabled 
                ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-50 border-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200" 
                : "bg-background hover:bg-accent text-foreground border-border",
              suggestionLoading && "opacity-75"
            )}
            onClick={(e) => e.preventDefault()}
          >
            {suggestionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bot className="h-4 w-4" />
            )}
            <span>AI</span>
            {isEnabled ? (
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            ) : (
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                isEnabled 
                  ? "bg-zinc-900 text-zinc-50 border-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:border-zinc-200" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isEnabled ? "Active" : "Inactive"}
            </Badge>
          </DropdownMenuLabel>
          
          {suggestionLoading && activeFeature && (
            <div className="px-3 pb-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{activeFeature}</span>
                  <span>{Math.round(loadingProgress)}%</span>
                </div>
                <Progress 
                  value={loadingProgress} 
                  className="h-1.5"
                />
              </div>
            </div>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => onToggle(!isEnabled)}
            className="py-2.5 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {isEnabled ? (
                  <Power className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <PowerOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <div className="text-sm font-medium">
                    {isEnabled ? "Disable" : "Enable"} AI
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Toggle AI assistance
                  </div>
                </div>
              </div>
              <div className={cn(
                "w-8 h-4 rounded-full border transition-all duration-200 relative",
                isEnabled 
                  ? "bg-zinc-900 border-zinc-900 dark:bg-zinc-50 dark:border-zinc-50" 
                  : "bg-muted border-border"
              )}>
                <div className={cn(
                  "w-3 h-3 rounded-full bg-background transition-all duration-200 absolute top-0.5",
                  isEnabled ? "left-4" : "left-0.5"
                )} />
              </div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setIsChatOpen(true)}
            className="py-2.5 cursor-pointer"
          >
            <div className="flex items-center gap-3 w-full">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Open Chat</div>
                <div className="text-xs text-muted-foreground">
                  Chat with AI assistant
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AIChatSidePanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onInsertCode={handleInsertCode}
        onRunCode={handleRunCode}
        activeFileName={activeFile?.filename}
        activeFileContent={activeFile?.content}
        activeFileLanguage="TypeScript" // Assuming TypeScript as the language
        cursorPosition={cursorPosition}
        theme="dark"
      />
    </>
  );
};

export default ToggleAI;
