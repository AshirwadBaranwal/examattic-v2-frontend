import type { Context } from "hono";
import type { AppEnv } from "../../types/app";
import { sanitizeAuthError } from "../../middleware/error-handler";

// ─── Better Auth Proxy Handler ───────────────────────────────────────────────
// Proxies auth requests to better-auth and sanitizes error responses.

export const handleAuthProxy = async (c: Context<AppEnv>) => {
    const auth = c.get("auth");

    let response: Response;
    try {
        response = await auth.handler(c.req.raw);
    } catch (err: any) {
        // better-auth threw an error (e.g. DB constraint violation)
        // Try to extract a known error code from the thrown error
        console.error("[AUTH_HANDLER_THROW]", {
            path: c.req.path,
            message: err?.message,
            code: err?.code,
            body: err?.body,
        });

        const code =
            err?.body?.code ||
            err?.code ||
            extractCodeFromMessage(err?.message);
        const rawMessage =
            err?.body?.message || err?.message || "Unknown error";

        const { status, body: safeBody } = sanitizeAuthError(code, rawMessage);
        return c.json(safeBody, status as any);
    }

    // Intercept error responses from better-auth and sanitize them
    if (!response.ok) {
        try {
            const cloned = response.clone();
            const contentType = cloned.headers.get("content-type") ?? "";

            if (contentType.includes("application/json")) {
                const body = (await cloned.json()) as any;

                console.error("[AUTH_ERROR_RESPONSE]", {
                    path: c.req.path,
                    status: response.status,
                    body,
                });

                // better-auth may nest error info at top level or inside body
                const code = body?.code || body?.error?.code;
                const message =
                    body?.message || body?.error?.message || body?.statusText;

                if (code || message) {
                    const { status, body: safeBody } = sanitizeAuthError(
                        code,
                        message ?? "An error occurred"
                    );
                    return c.json(safeBody, status as any);
                }
            }
        } catch {
            // If we can't parse the response, fall through
        }

        // If we couldn't parse a structured error, return generic based on status
        const { body: safeBody } = sanitizeAuthError(undefined, "Unknown error");
        return c.json(safeBody, response.status as any);
    }

    return response;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Try to extract a known error code from a raw error message string */
function extractCodeFromMessage(message?: string): string | undefined {
    if (!message) return undefined;
    const upper = message.toUpperCase();

    if (upper.includes("UNIQUE") || upper.includes("DUPLICATE") || upper.includes("ALREADY EXISTS"))
        return "USER_ALREADY_EXISTS";
    if (upper.includes("INVALID_PASSWORD") || upper.includes("INCORRECT PASSWORD"))
        return "INVALID_PASSWORD";
    if (upper.includes("USER_NOT_FOUND") || upper.includes("NO USER"))
        return "USER_NOT_FOUND";

    return undefined;
}

// ─── Get Current User Handler ────────────────────────────────────────────────

export const handleGetMe = async (c: Context<AppEnv>) => {
    const user = c.get("user");
    const session = c.get("session");
    return c.json({ user, session });
};
