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

    // 1. Move CORS to the VERY top
    app.use("*", cors({
        origin: (origin) => {
            // Logic to allow your specific frontend or all
            if (!origin) return "https://examattic-v2-frontend.examattic.workers.dev";
            if (origin.startsWith("http://localhost")) return origin;
            return origin.endsWith("examattic.workers.dev") ? origin : "https://examattic-v2-frontend.examattic.workers.dev";
        },
        allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE", "PATCH"],
        allowHeaders: ["Content-Type", "Authorization", "x-better-auth-secret"],
        exposeHeaders: ["Content-Length"],
        maxAge: 86400,
        credentials: true,
    }));

    // 2. Global Error Handler
    app.onError(globalErrorHandler);

    // 3. Auth Instance (Needs to be before session middleware)
    app.use("*", async (c, next) => {
        const auth = createAuth(c.env);
        c.set("auth", auth);
        await next();
    });

    // 4. Session Middleware - EXCLUDE auth routes
    // If you don't exclude /api/auth, your sign-in will fail because it has no session
    app.use("/api/*", async (c, next) => {
        if (c.req.path.startsWith("/api/auth")) {
            return await next();
        }
        return sessionMiddleware(c, next);
    });

    return app;
}
