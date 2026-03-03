import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
    listQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "./question.handler";

const questionRoutes = new Hono<AppEnv>()
    .get("/api/admin/questions", requireAuth, requireRole("admin"), listQuestions)
    .get("/api/admin/questions/:id", requireAuth, requireRole("admin"), getQuestion)
    .post("/api/admin/questions", requireAuth, requireRole("admin"), createQuestion)
    .put("/api/admin/questions/:id", requireAuth, requireRole("admin"), updateQuestion)
    .delete("/api/admin/questions/:id", requireAuth, requireRole("admin"), deleteQuestion);

export { questionRoutes };
