"use client";
import React from 'react'
import { PlaygroundEditor } from './playground-editor'
import type { TemplateFile } from '@/features/playground/libs/path-to-json'

interface PlaygroundEditorClientProps {
  templateData: any // Using any for now since we need to handle the complex template structure
  onSave?: (file: TemplateFile, content: string) => Promise<any>
}

const PlaygroundEditorClient: React.FC<PlaygroundEditorClientProps> = ({ templateData }) => {
  const handleSave = async (file: TemplateFile, content: string) => {
    try {
      // Validate input
      if (!file || !content) {
        throw new Error('Invalid file or content');
      }

      // Create the file path
      const filePath = `${file.filename}.${file.fileExtension}`;
      
      // Update the file content in the template data
      const updatedTemplateData = {
        ...templateData,
        items: updateFileInTemplate(templateData.items, filePath, content)
      };

      // Save to backend
      const response = await fetch('/api/playground/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          content,
          templateData: updatedTemplateData
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save file: ${response.statusText}`);
      }

      // Log success
      console.log(`Successfully saved ${filePath}`);
      
      // You could also emit an event or call a callback to notify parent components
      return updatedTemplateData;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  // Helper function to update file content in template structure
  const updateFileInTemplate = (items: any[], filePath: string, content: string): any[] => {
    return items.map(item => {
      if (item.folderName && item.items) {
        // This is a folder, recursively update its items
        return {
          ...item,
          items: updateFileInTemplate(item.items, filePath, content)
        };
      } else if (item.filename && item.fileExtension) {
        // This is a file, check if it matches the target file
        const currentFilePath = `${item.filename}.${item.fileExtension}`;
        if (currentFilePath === filePath) {
          return {
            ...item,
            content
          };
        }
      }
      return item;
    });
  };

  return (
    <div className="h-screen">
      <PlaygroundEditor 
        activeFile={undefined}
        content=""
        onContentChange={() => {}}
        suggestion={null}
        suggestionLoading={false}
        suggestionPosition={null}
        onAcceptSuggestion={() => {}}
        onRejectSuggestion={() => {}}
        onTriggerSuggestion={() => {}}
      />
    </div>
  )
}

export default PlaygroundEditorClient