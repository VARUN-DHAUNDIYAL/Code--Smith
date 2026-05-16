"use server";

import {
  currentUser,
  getCurrentUserId,
  requireUserId,
} from "@/features/auth/actions";
import { db } from "@/lib/db";
import type { TemplateFolder } from "../libs/path-to-json";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import {
  assertPlaygroundAccess,
  assertPlaygroundEditAccess,
  assertPlaygroundOwner,
} from "../libs/playground-access";
import { loadStarterTemplate } from "../libs/load-starter-template";

export type PlaygroundMeta = {
  id: string;
  title: string;
  description: string | null;
  template: string;
  userId: string;
  templateFiles: { content: unknown }[];
};

export const toggleStarMarked = async (
  playgroundId: string,
  isChecked: boolean
) => {
  const userId = await requireUserId();

  try {
    await assertPlaygroundAccess(playgroundId, userId);

    if (isChecked) {
      await db.starMark.create({
        data: {
          userId,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId,
          },
        },
      });
    }

    revalidatePath("/dashboard");
    return { success: true, isMarked: isChecked };
  } catch (error) {
    console.error("Error updating star mark:", error);
    return { success: false, error: "Failed to update star mark" };
  }
};

export const createPlayground = async (data: {
  title: string;
  template: "REACT" | "NEXTJS" | "EXPRESS" | "VUE" | "HONO" | "ANGULAR";
  description?: string;
}) => {
  const { template, title, description } = data;

    const userId = await requireUserId();

    try {
        const starterTemplate = await loadStarterTemplate(template);

    const playground = await db.playground.create({
      data: {
        title,
        description,
        template,
        userId,
        templateFiles: {
          create: {
            content: starterTemplate as unknown as Prisma.InputJsonValue,
          },
        },
      },
    });

    revalidatePath("/dashboard");
    return playground;
  } catch (error) {
    console.error("createPlayground error:", error);
    throw new Error("Failed to create playground. Please try again.");
  }
};

export const getAllPlaygroundForUser = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return [];
    }

    const user = await currentUser();

    const playground = await db.playground.findMany({
      where: {
        userId,
      },
      include: {
        Starmark: {
          where: {
            userId,
          },
          select: {
            isMarked: true,
          },
        },
      },
    });

    const playgroundsWithUser = playground.map((p) => ({
      ...p,
      user: {
        id: userId,
        name: user?.name || "User",
        email: user?.email || "",
        image: user?.image || "",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }));

    return playgroundsWithUser || [];
  } catch (error) {
    console.error("getAllPlaygroundForUser error:", error);
    return [];
  }
};

export const getPlaygroundById = async (
  id: string
): Promise<PlaygroundMeta | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    await assertPlaygroundAccess(id, userId);

    const playground = await db.playground.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        template: true,
        userId: true,
        templateFiles: {
          select: {
            content: true,
          },
        },
      },
    });

    return playground;
  } catch (error) {
    console.error("getPlaygroundById error:", error);
    return null;
  }
};

export const SaveUpdatedCode = async (
  playgroundId: string,
  data: TemplateFolder
) => {
  const userId = await requireUserId();

  try {
    await assertPlaygroundEditAccess(playgroundId, userId);

    const content = data as unknown as Prisma.InputJsonValue;
    const updatedPlayground = await db.templateFile.upsert({
      where: {
        playgroundId,
      },
      update: {
        content,
      },
      create: {
        playgroundId,
        content,
      },
    });

    return updatedPlayground;
  } catch (error) {
    console.error("SaveUpdatedCode error:", error);
    throw error instanceof Error ? error : new Error("Failed to save changes");
  }
};

export const deleteProjectById = async (id: string): Promise<void> => {
  const userId = await requireUserId();

  try {
    await assertPlaygroundOwner(id, userId);
    await db.playground.delete({
      where: { id, userId },
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("deleteProjectById error:", error);
    throw error;
  }
};

export const editProjectById = async (
  id: string,
  data: { title: string; description: string }
): Promise<void> => {
  const userId = await requireUserId();

  try {
    await assertPlaygroundOwner(id, userId);
    await db.playground.update({
      where: { id, userId },
      data,
    });
    revalidatePath("/dashboard");
  } catch (error) {
    console.error("editProjectById error:", error);
    throw error;
  }
};

export const duplicateProjectById = async (id: string): Promise<{ id: string }> => {
  const userId = await requireUserId();

  try {
    await assertPlaygroundOwner(id, userId);

    const originalPlayground = await db.playground.findFirst({
      where: { id, userId },
      include: {
        templateFiles: true,
      },
    });

    if (!originalPlayground) {
      throw new Error("Original playground not found");
    }

    const templateContent = originalPlayground.templateFiles[0]?.content;

    const duplicate = await db.playground.create({
      data: {
        title: `${originalPlayground.title} (Copy)`,
        description: originalPlayground.description,
        template: originalPlayground.template,
        userId,
        ...(templateContent
          ? {
              templateFiles: {
                create: {
                  content: templateContent as Prisma.InputJsonValue,
                },
              },
            }
          : {}),
      },
    });

    revalidatePath("/dashboard");
    return { id: duplicate.id };
  } catch (error) {
    console.error("duplicateProjectById error:", error);
    throw error;
  }
};
