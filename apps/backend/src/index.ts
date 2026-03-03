import { createApp } from "./app";
import { authRoutes } from "./features/auth/auth.routes";
import { examRoutes } from "./features/exams/exam.routes";
import { subjectRoutes } from "./features/subjects/subject.routes";
import { chapterRoutes } from "./features/chapters/chapter.routes";
import { questionRoutes } from "./features/questions/question.routes";

// ─── Create App ──────────────────────────────────────────────────────────────
const app = createApp();

// ─── Mount Feature Routes ────────────────────────────────────────────────────
const routes = app
  .route("/", authRoutes)
  .route("/", examRoutes)
  .route("/", subjectRoutes)
  .route("/", chapterRoutes)
  .route("/", questionRoutes)

  // ─── Health Check ──────────────────────────────────────────────────────────
  .get("/", (c) => {
    return c.json({ message: "Examattic API is running" });
  });

// ─── Export ──────────────────────────────────────────────────────────────────
export type AppType = typeof routes;
export default app;

