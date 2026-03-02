import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";

// Load .dev.vars (Cloudflare's env file) into process.env for drizzle-kit
const devVars = readFileSync(".dev.vars", "utf-8");
for (const line of devVars.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    process.env[key] = value;
}

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
