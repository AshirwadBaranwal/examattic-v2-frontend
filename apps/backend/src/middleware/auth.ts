import type { Context, Next } from "hono";
import type { Auth } from "../lib/auth";

// ─── Type Definitions ────────────────────────────────────────────────────────

type Env = {
    Bindings: {
        DATABASE_URL: string;
        BETTER_AUTH_SECRET: string;
        BETTER_AUTH_URL: string;
    };
    Variables: {
        user: AuthUser | null;
        session: AuthSession | null;
        auth: Auth;
    };
};

type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: string | null;
    image: string | null;
    banned: boolean | null;
    [key: string]: unknown;
};

type AuthSession = {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    [key: string]: unknown;
};

// ─── Session Middleware ──────────────────────────────────────────────────────
/**
 * Attaches user & session (if any) to the Hono context.
 * Does NOT block unauthenticated requests — use `requireAuth` for that.
 */
export const sessionMiddleware = async (c: Context<Env>, next: Next) => {
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
export const requireAuth = async (c: Context<Env>, next: Next) => {
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
    return async (c: Context<Env>, next: Next) => {
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
