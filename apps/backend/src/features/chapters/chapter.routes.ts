import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth, requireRole } from "../../middleware/auth";
import {
    listChaptersBySubject,
    createChapter,
    updateChapter,
    deleteChapter,
} from "./chapter.handler";

const chapterRoutes = new Hono<AppEnv>()
    .get(
        "/api/admin/subjects/:subjectId/chapters",
        requireAuth,
        requireRole("admin"),
        listChaptersBySubject
    )
    .post(
        "/api/admin/subjects/:subjectId/chapters",
        requireAuth,
        requireRole("admin"),
        createChapter
    )
    .put(
        "/api/admin/chapters/:id",
        requireAuth,
        requireRole("admin"),
        updateChapter
    )
    .delete(
        "/api/admin/chapters/:id",
        requireAuth,
        requireRole("admin"),
        deleteChapter
    );

export { chapterRoutes };
