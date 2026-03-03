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
import { getExamContent, syncExamContent } from "./exam-content.handler";

const examRoutes = new Hono<AppEnv>()
    .get("/api/admin/exams", requireAuth, requireRole("admin"), listExams)
    .get("/api/admin/exams/:id", requireAuth, requireRole("admin"), getExam)
    .post("/api/admin/exams", requireAuth, requireRole("admin"), createExam)
    .put("/api/admin/exams/:id", requireAuth, requireRole("admin"), updateExam)
    .patch("/api/admin/exams/:id/toggle", requireAuth, requireRole("admin"), toggleExamStatus)
    .get("/api/admin/exams/:examId/content", requireAuth, requireRole("admin"), getExamContent)
    .put("/api/admin/exams/:examId/content", requireAuth, requireRole("admin"), syncExamContent)
    .delete("/api/admin/exams/:id", requireAuth, requireRole("admin"), deleteExam);

export { examRoutes };
