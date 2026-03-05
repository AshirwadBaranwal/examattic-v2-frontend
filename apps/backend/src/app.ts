import { Hono } from "hono";
import { cors } from "hono/cors";
import { globalErrorHandler } from "./middleware/error-handler";
import { createAuth } from "./lib/auth";
import { sessionMiddleware } from "./middleware/auth";
import type { AppEnv } from "./types/app";

// ─── App Factory ─────────────────────────────────────────────────────────────
// Creates a fully configured Hono instance with all global middleware.
// Feature routes are mounted by index.ts after calling this.

export function createApp() {
    const app = new Hono<AppEnv>();

    // ─── CORS (Manual implementation for absolute control) ──────────────────
    app.use("*", async (c, next) => {
        const origin = c.req.header("Origin");
        if (origin) {
            c.header("Access-Control-Allow-Origin", origin);
            c.header("Access-Control-Allow-Credentials", "true");
            c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE, PATCH");
            c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-better-auth-secret");
            c.header("Access-Control-Max-Age", "86400");
        }

        if (c.req.method === "OPTIONS") {
            return c.body(null, 204);
        }
        await next();
    });

    // ─── Global Error Handler ────────────────────────────────────────────────
    app.onError(globalErrorHandler);

    // ─── 404 Handler ─────────────────────────────────────────────────────────
    app.notFound((c) => {
        return c.json(
            {
                success: false,
                error: "NOT_FOUND",
                message: "The requested endpoint does not exist.",
            },
            404
        );
    });

    // ─── Auth Instance Middleware ────────────────────────────────────────────
    // Creates the auth instance per-request (required for Workers env bindings)
    app.use("*", async (c, next) => {
        const auth = createAuth({
            DATABASE_URL: c.env.DATABASE_URL,
            BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
            BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
        });
        c.set("auth", auth);
        await next();
    });

    // ─── Session Middleware (for all /api routes except auth) ─────────────────
    app.use("/api/*", sessionMiddleware);

    return app;
}
