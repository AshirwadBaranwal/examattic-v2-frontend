import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

// ─── Known Error Codes → Human-Readable Messages ────────────────────────────
// Map internal/technical error codes to safe, user-facing messages.
// If an error code is NOT in this map, the user gets a generic message.
const ERROR_MAP: Record<string, { status: number; message: string }> = {
    // Auth errors
    USER_NOT_FOUND: { status: 404, message: "No account found with that email." },
    INVALID_PASSWORD: { status: 401, message: "Incorrect password. Please try again." },
    USER_ALREADY_EXISTS: { status: 409, message: "An account with this email already exists." },
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: { status: 409, message: "An account with this email already exists." },
    INVALID_EMAIL: { status: 400, message: "Please enter a valid email address." },
    INVALID_EMAIL_OR_PASSWORD: { status: 401, message: "Invalid email or password." },
    EMAIL_NOT_VERIFIED: { status: 403, message: "Please verify your email before logging in." },
    SESSION_EXPIRED: { status: 401, message: "Your session has expired. Please log in again." },
    INVALID_TOKEN: { status: 401, message: "Invalid or expired token." },
    TOO_MANY_REQUESTS: { status: 429, message: "Too many requests. Please wait a moment." },
    FORBIDDEN: { status: 403, message: "You don't have permission to perform this action." },
    USER_BANNED: { status: 403, message: "Your account has been suspended. Contact support." },
    MISSING_OR_NULL_ORIGIN: { status: 400, message: "Request origin is not allowed." },
    FAILED_TO_CREATE_USER: { status: 500, message: "Unable to create account. Please try again." },
    FAILED_TO_CREATE_SESSION: { status: 500, message: "Unable to create session. Please try again." },
    SOCIAL_ACCOUNT_ALREADY_LINKED: { status: 409, message: "This social account is already linked." },
    ACCOUNT_NOT_FOUND: { status: 404, message: "Account not found." },
    CREDENTIAL_ACCOUNT_NOT_FOUND: { status: 404, message: "No password set for this account." },
};

// ─── Partial-match fallback ──────────────────────────────────────────────────
// If the exact code isn't in the map, check if ANY map key is a prefix of the code.
// e.g. code "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" matches key "USER_ALREADY_EXISTS"
function findPartialMatch(code: string): { status: number; message: string } | undefined {
    for (const key of Object.keys(ERROR_MAP)) {
        if (code.startsWith(key) || key.startsWith(code)) {
            return ERROR_MAP[key];
        }
    }
    return undefined;
}

// ─── Validation Error Cleaner ────────────────────────────────────────────────
// Converts Zod-style "[body.field] expected X, received Y" → clean message
function cleanValidationMessage(raw: string): string {
    const msg = raw.toLowerCase();

    if (msg.includes("body.name") && msg.includes("undefined"))
        return "Name is required.";
    if (msg.includes("body.email") && msg.includes("undefined"))
        return "Email is required.";
    if (msg.includes("body.email") && msg.includes("invalid"))
        return "Please enter a valid email address.";
    if (msg.includes("body.password") && msg.includes("undefined"))
        return "Password is required.";
    if (msg.includes("body.password") && msg.includes("too_small"))
        return "Password must be at least 8 characters.";

    // Generic: strip [body.xxx] prefix
    const stripped = raw.replace(/\[body\.[^\]]+\]\s*/gi, "").trim();
    return stripped || "Please check your inputs and try again.";
}

// ─── Safe Error Response Builder ─────────────────────────────────────────────
export function sanitizeAuthError(code: string | undefined, rawMessage: string) {
    // 1. Check if it's a validation error
    if (code === "VALIDATION_ERROR") {
        return {
            status: 400,
            body: {
                success: false,
                error: "Validation failed",
                message: cleanValidationMessage(rawMessage),
            },
        };
    }

    // 2. Check our known error map (exact match)
    if (code && ERROR_MAP[code]) {
        const mapped = ERROR_MAP[code];
        return {
            status: mapped.status,
            body: {
                success: false,
                error: code,
                message: mapped.message,
            },
        };
    }

    // 3. Check partial match (for codes like USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL)
    if (code) {
        const partial = findPartialMatch(code);
        if (partial) {
            return {
                status: partial.status,
                body: {
                    success: false,
                    error: code,
                    message: partial.message,
                },
            };
        }
    }

    // 4. Fallback: NEVER leak the raw message — return a generic one
    return {
        status: 500,
        body: {
            success: false,
            error: "INTERNAL_ERROR",
            message: "Something went wrong. Please try again later.",
        },
    };
}

// ─── Hono Global Error Handler ───────────────────────────────────────────────
// This catches ALL uncaught errors thrown in any route or middleware.
// It ensures NO internal details (stack traces, DB errors, etc.) leak to the client.
export function globalErrorHandler(err: Error, c: Context) {
    // Log the full error internally for debugging (visible in Wrangler/Workers logs)
    console.error("[ERROR]", {
        path: c.req.path,
        method: c.req.method,
        error: err.message,
        stack: err.stack,
    });

    // Handle Hono's HTTPException (from middleware like requireAuth/requireRole)
    if (err instanceof HTTPException) {
        return c.json(
            {
                success: false,
                error: "HTTP_ERROR",
                message: err.message || "An error occurred.",
            },
            err.status
        );
    }

    // Catch-all: never leak internals
    const { status, body } = sanitizeAuthError(undefined, err.message);
    return c.json(body, status as any);
}

// ─── Better Auth Error Interceptor ───────────────────────────────────────────
// This is plugged into better-auth's `advanced.onAPIError` to intercept
// auth-specific errors BEFORE they reach the client.
export function authErrorInterceptor(error: any, _ctx: any) {
    const code = error.code || error.body?.code;
    const rawMessage = error.message || error.body?.message || "Unknown error";

    // Log internally
    console.error("[AUTH_ERROR]", { code, message: rawMessage });

    const { status, body } = sanitizeAuthError(code, rawMessage);

    return new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });
}
