import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { handleAuthProxy, handleGetMe } from "./auth.handler";
import { requireAuth } from "../../middleware/auth";

// ─── Auth Routes ─────────────────────────────────────────────────────────────
// Thin route layer — delegates all logic to handlers.

const authRoutes = new Hono<AppEnv>()
    // Better Auth handler — proxies all auth requests
    .on(["POST", "GET"], "/api/auth/**", handleAuthProxy)
    // Get current authenticated user
    .get("/api/me", requireAuth, handleGetMe);

export { authRoutes };
