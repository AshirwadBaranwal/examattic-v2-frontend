import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
    listSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
} from "./subject.handler";

const subjectRoutes = new Hono<AppEnv>()
    .get("/api/admin/subjects", requireAuth, requireRole("admin"), listSubjects)
    .get("/api/admin/subjects/:id", requireAuth, requireRole("admin"), getSubject)
    .post("/api/admin/subjects", requireAuth, requireRole("admin"), createSubject)
    .put("/api/admin/subjects/:id", requireAuth, requireRole("admin"), updateSubject)
    .delete("/api/admin/subjects/:id", requireAuth, requireRole("admin"), deleteSubject);

export { subjectRoutes };
