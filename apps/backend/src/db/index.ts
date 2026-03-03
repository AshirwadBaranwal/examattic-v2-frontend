import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export function createDb(databaseUrl: string) {
    const client = postgres(databaseUrl, {
        prepare: false,       // Required for Supabase Supavisor pooler
        max: 1,               // 1 connection per worker — prevents pool exhaustion
        idle_timeout: 20,     // Release idle connections after 20s
        connect_timeout: 15,  // Fail fast on connection issues
    });
    return drizzle(client, { schema });
}

export type Database = ReturnType<typeof createDb>;
