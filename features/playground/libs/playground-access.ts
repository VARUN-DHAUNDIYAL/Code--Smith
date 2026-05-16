import { db } from "@/lib/db";

export type PlaygroundAccessRole = "owner" | "editor" | "viewer";

export interface PlaygroundAccess {
  playgroundId: string;
  userId: string;
  role: PlaygroundAccessRole;
  canEdit: boolean;
}

/**
 * Returns access details if the user may open the playground (owner or accepted collaborator).
 */
export async function getPlaygroundAccess(
  playgroundId: string,
  userId: string
): Promise<PlaygroundAccess | null> {
  const playground = await db.playground.findUnique({
    where: { id: playgroundId },
    select: {
      id: true,
      userId: true,
      collaborations: {
        where: {
          collaboratorId: userId,
          status: "accepted",
        },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!playground) return null;

  if (playground.userId === userId) {
    return {
      playgroundId,
      userId,
      role: "owner",
      canEdit: true,
    };
  }

  const collaboration = playground.collaborations[0];
  if (!collaboration) return null;

  const role = collaboration.role === "editor" ? "editor" : "viewer";
  return {
    playgroundId,
    userId,
    role,
    canEdit: role === "editor",
  };
}

export async function assertPlaygroundAccess(
  playgroundId: string,
  userId: string
): Promise<PlaygroundAccess> {
  const access = await getPlaygroundAccess(playgroundId, userId);
  if (!access) {
    throw new Error("Playground not found or access denied");
  }
  return access;
}

export async function assertPlaygroundEditAccess(
  playgroundId: string,
  userId: string
): Promise<PlaygroundAccess> {
  const access = await assertPlaygroundAccess(playgroundId, userId);
  if (!access.canEdit) {
    throw new Error("You do not have permission to edit this playground");
  }
  return access;
}

export async function assertPlaygroundOwner(
  playgroundId: string,
  userId: string
): Promise<void> {
  const playground = await db.playground.findFirst({
    where: { id: playgroundId, userId },
    select: { id: true },
  });
  if (!playground) {
    throw new Error("Playground not found or access denied");
  }
}
