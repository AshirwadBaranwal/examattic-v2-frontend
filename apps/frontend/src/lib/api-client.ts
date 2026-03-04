import { hc } from "hono/client";
import type { AppType } from "backend/src/index";

// Type-safe Hono RPC client — all routes are inferred from the backend
export const api = hc<AppType>("http://localhost:8787", {
    init: {
        credentials: "include", // Send cookies cross-origin
    },
});
