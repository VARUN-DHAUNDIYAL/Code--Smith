import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { templatePaths } from "@/lib/template";
import { scanTemplateDirectory } from "@/features/playground/libs/path-to-json.node";
import type { TemplateFolder } from "@/features/playground/libs/path-to-json";

export const runtime = "nodejs";

function parseStoredTemplate(content: unknown): TemplateFolder | null {
  if (!content) return null;

  if (typeof content === "string") {
    try {
      return JSON.parse(content) as TemplateFolder;
    } catch {
      return null;
    }
  }

  if (typeof content === "object" && "items" in content) {
    return content as TemplateFolder;
  }

  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing playground ID" },
        { status: 400 }
      );
    }

    const playground = await db.playground.findUnique({
      where: { id },
      include: { templateFiles: true },
    });

    if (!playground) {
      return NextResponse.json(
        { error: "Playground not found" },
        { status: 404 }
      );
    }

    const storedTemplate = parseStoredTemplate(
      playground.templateFiles[0]?.content
    );

    if (storedTemplate) {
      return NextResponse.json({
        success: true,
        templateJson: storedTemplate,
      });
    }

    const templateKey = playground.template as keyof typeof templatePaths;
    const templatePath = templatePaths[templateKey];

    if (!templatePath) {
      return NextResponse.json(
        { error: "Invalid template" },
        { status: 404 }
      );
    }

    const inputPath = path.join(
      process.cwd(),
      templatePath.replace(/^[/\\]+/, "")
    );
    const templateJson = await scanTemplateDirectory(inputPath);

    return NextResponse.json({
      success: true,
      templateJson,
    });
  } catch (error) {
    console.error("Error generating template JSON:", error);
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    );
  }
}
