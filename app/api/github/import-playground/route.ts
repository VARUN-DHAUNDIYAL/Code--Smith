import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type {
  TemplateFile,
  TemplateFolder,
} from "@/features/playground/libs/path-to-json";

export const runtime = "nodejs";

const SKIP_PATH_SEGMENTS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
]);
const SKIP_FILES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
]);

const MAX_FILES = 80;
const MAX_FILE_BYTES = 120_000;

function getGithubToken(request: NextRequest) {
  return request.cookies.get("github_token")?.value ?? null;
}

function ensureFolder(
  root: TemplateFolder,
  parts: string[]
): TemplateFolder {
  let current = root;
  for (const part of parts) {
    let folder = current.items.find(
      (item) => "folderName" in item && item.folderName === part
    ) as TemplateFolder | undefined;
    if (!folder) {
      folder = { folderName: part, items: [] };
      current.items.push(folder);
    }
    current = folder;
  }
  return current;
}

function detectTemplate(
  paths: string[]
): "REACT" | "NEXTJS" | "VUE" | "ANGULAR" | "EXPRESS" | "HONO" {
  const joined = paths.join("\n").toLowerCase();
  if (joined.includes("next.config")) return "NEXTJS";
  if (joined.includes("angular.json")) return "ANGULAR";
  if (joined.includes("vite.config") && joined.includes("vue")) return "VUE";
  if (joined.includes("hono")) return "HONO";
  if (joined.includes("express")) return "EXPRESS";
  return "REACT";
}

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = getGithubToken(request);
    if (!token) {
      return NextResponse.json(
        { error: "GitHub not connected" },
        { status: 401 }
      );
    }

    const { owner, repo, title } = await request.json();
    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo" },
        { status: 400 }
      );
    }

    const treeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!treeResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch repository tree" },
        { status: treeResponse.status }
      );
    }

    const tree = await treeResponse.json();
    const blobs = (tree.tree || []).filter(
      (entry: { type: string; path: string; size?: number }) =>
        entry.type === "blob" &&
        !SKIP_FILES.has(entry.path.split("/").pop() || "") &&
        !entry.path.split("/").some((seg: string) => SKIP_PATH_SEGMENTS.has(seg)) &&
        (entry.size === undefined || entry.size < MAX_FILE_BYTES)
    );

    const root: TemplateFolder = { folderName: "Root", items: [] };
    let imported = 0;

    for (const blob of blobs.slice(0, MAX_FILES)) {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${blob.path}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3.raw",
          },
        }
      );

      if (!fileResponse.ok) continue;

      const content = await fileResponse.text();
      const parts = blob.path.split("/");
      const fileName = parts.pop()!;
      const dot = fileName.lastIndexOf(".");
      const filename = dot > 0 ? fileName.slice(0, dot) : fileName;
      const fileExtension = dot > 0 ? fileName.slice(dot + 1) : "txt";

      const parent = ensureFolder(root, parts);
      const file: TemplateFile = {
        filename,
        fileExtension,
        content,
      };
      parent.items.push(file);
      imported++;
    }

    if (imported === 0) {
      return NextResponse.json(
        { error: "No importable files found in this repository" },
        { status: 400 }
      );
    }

    const template = detectTemplate(blobs.map((b: { path: string }) => b.path));

    const playground = await db.playground.create({
      data: {
        title: title || repo,
        description: `Imported from github.com/${owner}/${repo}`,
        template,
        userId: user.id,
        templateFiles: {
          create: {
            content: root as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      playgroundId: playground.id,
      importedFiles: imported,
    });
  } catch (error) {
    console.error("GitHub import error:", error);
    return NextResponse.json(
      { error: "Failed to import repository" },
      { status: 500 }
    );
  }
}
