// middleware/auth.ts
import { Context, Next } from "hono";
import type { AppEnv } from "../types/app";

export const sessionMiddleware = async (c: Context<AppEnv>, next: Next) => {
    const auth = c.get("auth");

    // Use the contextual auth instance to verify the session
    const session = await auth.api.getSession({
        headers: c.req.raw.headers,
    });

    if (!session) {
        c.set("user", null);
        c.set("session", null);
        return await next();
    }

    c.set("user", session.user);
    c.set("session", session.session);
    return await next();
};

export const requireAuth = async (c: Context<AppEnv>, next: Next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    await next();
};

export const requireRole = (role: string) => async (c: Context<AppEnv>, next: Next) => {
    const user = c.get("user");
    if (!user) {
        return c.json({ message: "Unauthorized" }, 401);
    }
    if (user.role !== role) {
        return c.json({ message: "Forbidden" }, 403);
    }
    await next();
};
