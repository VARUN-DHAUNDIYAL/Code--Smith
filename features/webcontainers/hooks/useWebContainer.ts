"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { WebContainer } from "@webcontainer/api";
import { transformToWebContainerFormat } from "./transformer";
import type { TemplateFolder } from "@/features/playground/types";

export type WebContainerStatus =
  | "idle"
  | "booting"
  | "mounting"
  | "installing"
  | "starting"
  | "ready"
  | "error";

interface UseWebContainerReturn {
  instance: WebContainer | null;
  previewUrl: string | null;
  status: WebContainerStatus;
  error: string | null;
  writeFileSync: (filePath: string, content: string) => Promise<void>;
  isReady: boolean;
}

async function waitForProcess(process: { exit: Promise<number> }) {
  const exitCode = await process.exit;
  if (exitCode !== 0) {
    throw new Error(`Process exited with code ${exitCode}`);
  }
}

export function useWebContainer(
  playgroundId: string | undefined,
  templateData: TemplateFolder | null
): UseWebContainerReturn {
  const instanceRef = useRef<WebContainer | null>(null);
  const bootPromiseRef = useRef<Promise<WebContainer> | null>(null);
  const bootedPlaygroundIdRef = useRef<string | null>(null);

  const [instance, setInstance] = useState<WebContainer | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<WebContainerStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const writeFileSync = useCallback(
    async (filePath: string, content: string) => {
      const wc = instanceRef.current;
      if (!wc) return;
      const normalizedPath = filePath.replace(/\\/g, "/");
      await wc.fs.writeFile(normalizedPath, content, { encoding: "utf-8" });
    },
    []
  );

  const bootContainer = useCallback(async (data: TemplateFolder) => {
    if (bootPromiseRef.current) {
      return bootPromiseRef.current;
    }

    const bootPromise = (async () => {
      setError(null);
      setStatus("booting");

      const { WebContainer } = await import("@webcontainer/api");
      const wc = await WebContainer.boot();
      instanceRef.current = wc;
      setInstance(wc);

      wc.on("server-ready", (_port, url) => {
        setPreviewUrl(url);
        setStatus("ready");
      });

      setStatus("mounting");
      const files = transformToWebContainerFormat(data);
      await wc.mount(files);

      try {
        await wc.fs.readFile("package.json", "utf-8");
      } catch {
        setStatus("ready");
        return wc;
      }

      setStatus("installing");
      const installProcess = await wc.spawn("npm", ["install"]);
      await waitForProcess(installProcess);

      setStatus("starting");
      await wc.spawn("npm", ["run", "dev"]);

      return wc;
    })();

    bootPromiseRef.current = bootPromise;

    try {
      return await bootPromise;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start WebContainer";
      setError(message);
      setStatus("error");
      throw err;
    } finally {
      bootPromiseRef.current = null;
    }
  }, []);

  // Reset WebContainer when switching playgrounds
  useEffect(() => {
    if (!playgroundId) return;

    if (
      bootedPlaygroundIdRef.current &&
      bootedPlaygroundIdRef.current !== playgroundId
    ) {
      instanceRef.current = null;
      setInstance(null);
      setPreviewUrl(null);
      setStatus("idle");
      setError(null);
      bootedPlaygroundIdRef.current = null;
    }
  }, [playgroundId]);

  // Boot once per playground (not on every save / templateData change)
  useEffect(() => {
    if (!playgroundId || !templateData?.items?.length) return;
    if (bootedPlaygroundIdRef.current === playgroundId) return;

    const snapshot = templateData;
    bootedPlaygroundIdRef.current = playgroundId;
    bootContainer(snapshot).catch((err) => {
      console.error("WebContainer boot error:", err);
      bootedPlaygroundIdRef.current = null;
    });
  }, [playgroundId, templateData, bootContainer]);

  return {
    instance,
    previewUrl,
    status,
    error,
    writeFileSync,
    isReady: status === "ready",
  };
}
