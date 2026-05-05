import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { filePath, content, templateData, playgroundId } = body;

    if (!playgroundId) {
      return NextResponse.json(
        { error: "Missing required field: playgroundId" },
        { status: 400 }
      );
    }

    const playground = await db.playground.findFirst({
      where: {
        id: playgroundId,
        OR: [
          { userId: user.id },
          {
            collaborations: {
              some: {
                collaboratorId: user.id,
                status: "accepted",
                role: "editor",
              },
            },
          },
        ],
      },
    });

    if (!playground) {
      return NextResponse.json(
        { error: "Playground not found or access denied" },
        { status: 404 }
      );
    }

    const nextContent = templateData || content;

    if (!nextContent) {
      return NextResponse.json(
        { error: "Missing templateData or content" },
        { status: 400 }
      );
    }

    const updatedTemplateFile = await db.templateFile.upsert({
      where: { playgroundId },
      update: {
        content: nextContent,
        updatedAt: new Date(),
      },
      create: {
        playgroundId,
        content: nextContent,
      },
    });

    await db.playground.update({
      where: { id: playgroundId },
      data: { updatedAt: new Date() },
    });

    await db.activityLog
      .create({
        data: {
          playgroundId,
          userId: user.id,
          action: "file_save",
          details: { filePath: filePath || null },
        },
      })
      .catch(() => null);

    return NextResponse.json({
      success: true,
      message: "Playground saved successfully",
      data: {
        filePath,
        updatedAt: updatedTemplateFile.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error saving playground:", error);
    return NextResponse.json(
      { error: "Failed to save playground" },
      { status: 500 }
    );
  }
}
