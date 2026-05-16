/**
 * Routes that are accessible without an authenticated session.
 */
export const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/error",
  "/auth/error",
  "/auth/sign-in",
];

/**
 * Routes that should redirect authenticated users back into the app.
 */
export const authRoutes = ["/login", "/signup", "/auth/sign-in"];

/**
 * Auth.js route prefix.
 */
export const apiAuthPrefix = "/api/auth";

/**
 * Default redirect after a successful sign-in.
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";

/**
 * Routes that require specific roles.
 */
export const roleRoutes = {
  admin: ["/admin", "/admin/users", "/admin/settings"],
  premium: ["/premium", "/premium/features"],
};
