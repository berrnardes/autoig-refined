/**
 * Routes accessible without authentication.
 */
export const publicRoutes = ["/"];

/**
 * Routes used for authentication (login, signup).
 * Logged-in users hitting these get redirected to the dashboard.
 */
export const authRoutes = ["/login"];

/**
 * Prefix for the auth API routes.
 * Routes starting with this are always allowed through.
 */
export const apiAuthPrefix = "/api/auth";

/**
 * Prefix for webhook API routes.
 * Always allowed through (external services need access).
 */
export const apiWebhooksPrefix = "/api/webhooks";

/**
 * Where to redirect logged-in users when they hit an auth route.
 */
export const DEFAULT_LOGIN_REDIRECT = "/dashboard";
