import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { createDb } from "../db";
import * as schema from "../db/schema";
import { authErrorInterceptor } from "../middleware/error-handler";

/**
 * Creates a better-auth instance bound to the given environment.
 * Called per-request in Cloudflare Workers (env is per-request).
 */
export function createAuth(env: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
}) {
    const db = createDb(env.DATABASE_URL);

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: "pg",
            schema,
        }),
        secret: env.BETTER_AUTH_SECRET,
        baseURL: env.BETTER_AUTH_URL,
        trustedOrigins: ["http://localhost:3000", "https://examattic-v2-frontend.examattic.workers.dev"],
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 8,
        },
        session: {
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            updateAge: 60 * 60 * 24,      // refresh session every 24h
            cookieCache: {
                enabled: true,
                maxAge: 60 * 5, // 5 min cache
            },
        },
        plugins: [
            admin({
                defaultRole: "student",
            }),
        ],
        advanced: {
            disableCSRFCheck: true, // CORS is handled by Hono middleware
            defaultCookieAttributes: {
                sameSite: "none",
                secure: true,
                partitioned: true,
            },
            onAPIError: {
                throw: false,
                onError: authErrorInterceptor,
            },
        },
    });
}

export type Auth = ReturnType<typeof createAuth>;
