import { hc } from "hono/client";
import type { AppType } from "backend/src/index";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

// Type-safe Hono RPC client — all routes are inferred from the backend
export const api = hc<AppType>(API_URL, {
    init: {
        credentials: "include", // Send cookies cross-origin
    },
});
