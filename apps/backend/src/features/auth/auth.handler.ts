import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { sanitizeAuthError } from "../../middleware/error-handler";

// ─── Better Auth Proxy Handler ───────────────────────────────────────────────
// Proxies auth requests to better-auth and sanitizes error responses.

export const handleAuthProxy = async (c: Context<AppEnv>) => {
    const auth = c.get("auth");
    const response = await auth.handler(c.req.raw);

    // Intercept error responses from better-auth and sanitize them
    if (!response.ok) {
        try {
            const cloned = response.clone();
            const body = (await cloned.json()) as any;

            if (body?.code || body?.message) {
                const { status, body: safeBody } = sanitizeAuthError(
                    body.code,
                    body.message
                );
                return c.json(safeBody, status as any);
            }
        } catch {
            // If we can't parse the response, just pass it through
        }
    }

    return response;
};

// ─── Get Current User Handler ────────────────────────────────────────────────

export const handleGetMe = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const session = c.get("session");
    return c.json({ user, session });
};
