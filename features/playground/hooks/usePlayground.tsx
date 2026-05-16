import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  getPlaygroundById,
  SaveUpdatedCode,
  type PlaygroundMeta,
} from "@/features/playground/actions";
import type { TemplateFolder } from "@/features/playground/libs/path-to-json";

export interface PlaygroundData {
  id: string;
  title: string;
  description: string | null;
  template: string;
  userId: string;
}

interface UsePlaygroundReturn {
  playgroundData: PlaygroundData | null;
  templateData: TemplateFolder | null;
  isLoading: boolean;
  error: string | null;
  loadPlayground: () => Promise<void>;
  saveTemplateData: (data: TemplateFolder) => Promise<TemplateFolder>;
}

function parseTemplateContent(rawContent: unknown): TemplateFolder | null {
  if (!rawContent) return null;

  if (typeof rawContent === "string") {
    try {
      return JSON.parse(rawContent) as TemplateFolder;
    } catch {
      return null;
    }
  }

  if (typeof rawContent === "object" && rawContent !== null && "items" in rawContent) {
    return rawContent as TemplateFolder;
  }

  return null;
}

export const usePlayground = (id: string): UsePlaygroundReturn => {
  const [playgroundData, setPlaygroundData] = useState<PlaygroundData | null>(
    null
  );
  const [templateData, setTemplateData] = useState<TemplateFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlayground = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getPlaygroundById(id);

      if (!data) {
        setError("Playground not found or you do not have access.");
        toast.error("Playground not found or access denied");
        return;
      }

      setPlaygroundData({
        id: data.id,
        title: data.title,
        description: data.description,
        template: data.template,
        userId: data.userId,
      });

      const storedTemplate = parseTemplateContent(
        data.templateFiles[0]?.content
      );

      if (storedTemplate) {
        setTemplateData(storedTemplate);
        return;
      }

      const res = await fetch(`/api/template/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error || `Failed to load template (${res.status})`
        );
      }

      const templateRes = await res.json();
      const nextTemplateData = Array.isArray(templateRes.templateJson)
        ? {
            folderName: "Root",
            items: templateRes.templateJson,
          }
        : templateRes.templateJson || {
            folderName: "Root",
            items: [],
          };

      setTemplateData(nextTemplateData);
    } catch (err) {
      console.error("Error loading playground:", err);
      const message =
        err instanceof Error ? err.message : "Failed to load playground data";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const saveTemplateData = useCallback(
    async (data: TemplateFolder) => {
      try {
        await SaveUpdatedCode(id, data);
        return data;
      } catch (err) {
        console.error("Error saving template data:", err);
        const message =
          err instanceof Error ? err.message : "Failed to save changes";
        toast.error(message);
        throw err;
      }
    },
    [id]
  );

  useEffect(() => {
    loadPlayground();
  }, [loadPlayground]);

  return {
    playgroundData,
    templateData,
    isLoading,
    error,
    loadPlayground,
    saveTemplateData,
  };
};
