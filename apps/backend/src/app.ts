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

    // ─── CORS ────────────────────────────────────────────────────────────────
    app.use(
        "*",
        cors({
            origin: ["http://localhost:3000", "https://examattic-v2-frontend.examattic.workers.dev"],
            allowHeaders: ["Content-Type", "Authorization"],
            allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
            exposeHeaders: ["Content-Length"],
            maxAge: 600,
            credentials: true,
        })
    );

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
