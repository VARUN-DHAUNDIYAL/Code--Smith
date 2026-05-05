"use server";

import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Returns the current Clerk user's ID (string) or null if not signed in.
 */
export const getCurrentUserId = async (): Promise<string | null> => {
  const { userId } = await auth();
  return userId;
};

/**
 * Returns a user-like object compatible with existing code that expects { id, email, name, image }.
 * Fetches full profile from Clerk.
 */
export const currentUser = async () => {
  const clerkUser = await clerkCurrentUser();
  if (!clerkUser) return null;

  return {
    id: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
    name: `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || null,
    image: clerkUser.imageUrl ?? null,
  };
};

/**
 * Legacy helpers kept for compatibility — no longer used for auth,
 * but may be called from existing code.
 */
export const getUserById = async (id: string) => {
  try {
    // With Clerk, we don't have a User table. Return a stub so old code doesn't crash.
    const { userId } = await auth();
    if (!userId || userId !== id) return null;
    return await currentUser();
  } catch {
    return null;
  }
};

export const getAccountByUserId = async (_userId: string) => {
  // No Account table with Clerk — return null gracefully.
  return null;
};