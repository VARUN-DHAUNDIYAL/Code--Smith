/**
 * Client-safe feature flags (NEXT_PUBLIC_*).
 * Unset or any value other than "true" is treated as disabled.
 */
export function isAIEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_AI === "true";
}
