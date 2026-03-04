import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
    listSources,
    getSource,
    createSource,
    updateSource,
    deleteSource,
    toggleSourceStatus,
} from "./source.handler";

const sourceRoutes = new Hono<AppEnv>()
    .get("/api/admin/sources", requireAuth, requireRole("admin"), listSources)
    .get("/api/admin/sources/:id", requireAuth, requireRole("admin"), getSource)
    .post("/api/admin/sources", requireAuth, requireRole("admin"), createSource)
    .put("/api/admin/sources/:id", requireAuth, requireRole("admin"), updateSource)
    .patch("/api/admin/sources/:id/toggle", requireAuth, requireRole("admin"), toggleSourceStatus)
    .delete("/api/admin/sources/:id", requireAuth, requireRole("admin"), deleteSource);

export { sourceRoutes };
