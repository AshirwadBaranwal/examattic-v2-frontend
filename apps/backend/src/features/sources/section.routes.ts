import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
    listSections,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    upsertSectionSubjects,
} from "./section.handler";

const sectionRoutes = new Hono<AppEnv>()
    .get(
        "/api/admin/sources/:sourceId/sections",
        requireAuth,
        requireRole("admin"),
        listSections
    )
    .post(
        "/api/admin/sources/:sourceId/sections",
        requireAuth,
        requireRole("admin"),
        createSection
    )
    .put(
        "/api/admin/sources/:sourceId/sections/:id",
        requireAuth,
        requireRole("admin"),
        updateSection
    )
    .delete(
        "/api/admin/sources/:sourceId/sections/:id",
        requireAuth,
        requireRole("admin"),
        deleteSection
    )
    .patch(
        "/api/admin/sources/:sourceId/sections/reorder",
        requireAuth,
        requireRole("admin"),
        reorderSections
    )
    .put(
        "/api/admin/sources/:sourceId/sections/:id/subjects",
        requireAuth,
        requireRole("admin"),
        upsertSectionSubjects
    );

export { sectionRoutes };
