import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
    listExams,
    getExam,
    createExam,
    updateExam,
    deleteExam,
    toggleExamStatus,
} from "./exam.handler";

const examRoutes = new Hono<AppEnv>()
    .get("/api/admin/exams", requireAuth, requireRole("admin"), listExams)
    .get("/api/admin/exams/:id", requireAuth, requireRole("admin"), getExam)
    .post("/api/admin/exams", requireAuth, requireRole("admin"), createExam)
    .put("/api/admin/exams/:id", requireAuth, requireRole("admin"), updateExam)
    .patch("/api/admin/exams/:id/toggle", requireAuth, requireRole("admin"), toggleExamStatus)
    .delete("/api/admin/exams/:id", requireAuth, requireRole("admin"), deleteExam);

export { examRoutes };
