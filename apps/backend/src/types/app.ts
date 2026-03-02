import type { createAuth } from "../lib/auth";

// ─── Cloudflare Worker Bindings ──────────────────────────────────────────────
export type Bindings = {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
};

// ─── Auth Types ──────────────────────────────────────────────────────────────
export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: string | null;
    image: string | null;
    banned: boolean | null;
    [key: string]: unknown;
};

export type AuthSession = {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    [key: string]: unknown;
};

// ─── Hono Context Variables ──────────────────────────────────────────────────
export type Variables = {
    user: AuthUser | null;
    session: AuthSession | null;
    auth: ReturnType<typeof createAuth>;
};

// ─── Combined App Environment (use this as generic for Hono) ─────────────────
export type AppEnv = {
    Bindings: Bindings;
    Variables: Variables;
};
