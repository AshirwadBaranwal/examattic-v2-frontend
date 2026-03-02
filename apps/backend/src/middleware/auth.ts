import type { Context, Next } from "hono";
import type { AppEnv, AuthUser, AuthSession } from "../types/app";

// ─── Session Middleware ──────────────────────────────────────────────────────
/**
 * Attaches user & session (if any) to the Hono context.
 * Does NOT block unauthenticated requests — use `requireAuth` for that.
 */
export const sessionMiddleware = async (c: Context<AppEnv>, next: Next) => {
    const auth = c.get("auth");
    try {
        const session = await auth.api.getSession({
            headers: c.req.raw.headers,
        });

        if (session) {
            c.set("user", session.user as unknown as AuthUser);
            c.set("session", session.session as unknown as AuthSession);
        } else {
            c.set("user", null);
            c.set("session", null);
        }
    } catch {
        c.set("user", null);
        c.set("session", null);
    }

    await next();
};

// ─── Require Auth ────────────────────────────────────────────────────────────
/**
 * Returns 401 if the user is not authenticated.
 * Must be used AFTER `sessionMiddleware`.
 *
 * @example
 * app.use("/api/protected/*", sessionMiddleware, requireAuth);
 */
export const requireAuth = async (c: Context<AppEnv>, next: Next) => {
    const user = c.get("user");

    if (!user) {
        return c.json({ error: "Unauthorized", message: "You must be logged in" }, 401);
    }

    await next();
};

// ─── Require Role (RBAC) ────────────────────────────────────────────────────
/**
 * Returns a middleware that checks the user has the required role.
 * Returns 403 if the role doesn't match.
 * Must be used AFTER `sessionMiddleware` and `requireAuth`.
 *
 * @example
 * // Single role
 * app.use("/api/admin/*", sessionMiddleware, requireAuth, requireRole("admin"));
 *
 * // Multiple roles (OR — any of the listed roles is accepted)
 * app.use("/api/shared/*", sessionMiddleware, requireAuth, requireRole("admin", "student"));
 */
export function requireRole(...roles: string[]) {
    return async (c: Context<AppEnv>, next: Next) => {
        const user = c.get("user");

        if (!user) {
            return c.json({ error: "Unauthorized", message: "You must be logged in" }, 401);
        }

        const userRole = user.role ?? "student";

        if (!roles.includes(userRole)) {
            return c.json(
                {
                    error: "Forbidden",
                    message: `Access denied. Required role: ${roles.join(" or ")}. Your role: ${userRole}`,
                },
                403
            );
        }

        await next();
    };
}
