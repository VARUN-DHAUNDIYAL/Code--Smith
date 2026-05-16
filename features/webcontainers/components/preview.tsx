"use client";

import { Loader2, Globe, AlertCircle } from "lucide-react";
import type { WebContainerStatus } from "@/features/webcontainers/hooks/useWebContainer";
import { cn } from "@/lib/utils";

const statusLabels: Record<WebContainerStatus, string> = {
  idle: "Initializing…",
  booting: "Booting WebContainer…",
  mounting: "Mounting project files…",
  installing: "Running npm install…",
  starting: "Starting dev server…",
  ready: "Live preview",
  error: "Preview unavailable",
};

interface WebContainerPreviewProps {
  url: string | null;
  status: WebContainerStatus;
  error?: string | null;
  className?: string;
}

export function WebContainerPreview({
  url,
  status,
  error,
  className,
}: WebContainerPreviewProps) {
  const isLoading = status !== "ready" && status !== "error";
  const label = statusLabels[status];

  return (
    <div className={cn("flex flex-col h-full min-h-0 bg-background", className)}>
      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30 shrink-0">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-auto" />
        )}
      </div>

      <div className="flex-1 min-h-0 relative bg-white dark:bg-zinc-950">
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error || "Could not start the preview environment."}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        )}

        {url && status === "ready" && (
          <iframe
            key={url}
            src={url}
            title="App preview"
            className="absolute inset-0 w-full h-full border-0"
            allow="cross-origin-isolated"
          />
        )}
      </div>
    </div>
  );
}
