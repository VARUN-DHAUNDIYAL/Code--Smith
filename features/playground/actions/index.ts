"use server"

import { currentUser } from "@/features/auth/actions";
import { db } from "@/lib/db"
import type { TemplateFolder } from "../libs/path-to-json";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";


// Toggle marked status for a problem
export const toggleStarMarked = async (playgroundId: string, isChecked: boolean) => {
    const user = await currentUser();
    const userId = user?.id;
  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    if (isChecked) {
      await db.starMark.create({
        data: {
          userId: userId!,
          playgroundId,
          isMarked: isChecked,
        },
      });
    } else {
      await db.starMark.delete({
        where: {
          userId_playgroundId: {
            userId,
            playgroundId: playgroundId,
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

    const user = await currentUser();
    if (!user?.id) {
        throw new Error("User ID is required");
    }

    try {
        const playground = await db.playground.create({
            data: {
                title,
                description,
                template,
                userId: user.id,
            }
        });

        revalidatePath("/dashboard");
        return playground;
    } catch (error) {
        console.error("createPlayground error:", error);
        throw new Error("Failed to create playground. Please try again.");
    }
}


export const getAllPlaygroundForUser = async () => {
    try {
        const user = await currentUser();

        // If no user is found, return an empty array
        if (!user || !user.id) {
            return [];
        }

        const playground = await db.playground.findMany({
            where: {
                userId: user.id
            },
            include: {
                user: true,
                Starmark: {
                    where: {
                        userId: user.id
                    },
                    select: {
                        isMarked: true
                    }
                }
            }
        });

        return playground || [];
    } catch (error) {
        console.error("getAllPlaygroundForUser error:", error);
        return [];
    }
}

export const getPlaygroundById = async (id: string) => {
    try {
        const playground = await db.playground.findUnique({
            where: { id },
            select: {
              templateFiles: {
                select: {
                  content: true
                }
              }
            }
        });
        return playground;
    } catch (error) {
        console.error("getPlaygroundById error:", error);
        return null;
    }
}

export const SaveUpdatedCode = async (playgroundId: string, data: TemplateFolder) => {
  const user = await currentUser();
  if (!user) return null;

  try {
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
    return null;
  }
};

export const deleteProjectById = async (id: string): Promise<void> => {
    try {
        await db.playground.delete({
            where: { id }
        });
        revalidatePath("/dashboard");
    } catch (error) {
        console.error("deleteProjectById error:", error);
        throw error;
    }
}


export const editProjectById = async (id: string, data: { title: string; description: string }): Promise<void> => {
    try {
        await db.playground.update({
            where: { id },
            data,
        });
        revalidatePath("/dashboard");
    } catch (error) {
        console.error("editProjectById error:", error);
        throw error;
    }
}

export const duplicateProjectById = async (id: string): Promise<void> => {
    try {
        const originalPlayground = await db.playground.findUnique({
            where: { id },
            include: {
                templateFiles: true,
            },
        });

        if (!originalPlayground) {
            throw new Error("Original playground not found");
        }

        await db.playground.create({
            data: {
                title: `${originalPlayground.title} (Copy)`,
                description: originalPlayground.description,
                template: originalPlayground.template,
                userId: originalPlayground.userId,
                templateFiles: {
                    create: originalPlayground.templateFiles.map((file) => ({
                        content: file.content as Prisma.InputJsonValue,
                    })),
                },
            },
        });

        revalidatePath("/dashboard");
    } catch (error) {
        console.error("duplicateProjectById error:", error);
        throw error;
    }
};
