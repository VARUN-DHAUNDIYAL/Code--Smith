"use server";

import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";

export type AppUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

/**
 * Returns the current Clerk user's ID from the session (no extra API call).
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const { userId } = await auth();
  return userId;
};

/**
 * Returns user profile for server code. Uses session first; only calls Clerk API
 * when needed, with a safe fallback if the API fails.
 */
export const currentUser = async (): Promise<AppUser | null> => {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const clerkUser = await clerkCurrentUser();
    if (clerkUser) {
      return {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        name:
          `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
          null,
        image: clerkUser.imageUrl ?? null,
      };
    }
  } catch (error) {
    console.error(
      "Clerk currentUser() API failed; using session userId only:",
      error
    );
  }

  return {
    id: userId,
    email: "",
    name: "User",
    image: null,
  };
};

/**
 * Requires a signed-in user; throws if missing.
 */
export const requireUserId = async (): Promise<string> => {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  return userId;
};

export const getUserById = async (id: string) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId || userId !== id) return null;
    return await currentUser();
  } catch {
    return null;
  }
};

export const getAccountByUserId = async (_userId: string) => {
  return null;
};
