import { createApp } from "./app";
import { authRoutes } from "./features/auth/auth.routes";
import { requireAuth, requireRole } from "./middleware/auth";

// ─── Create App ──────────────────────────────────────────────────────────────
const app = createApp();

// ─── Mount Feature Routes ────────────────────────────────────────────────────
const routes = app
  .route("/", authRoutes)

  // ─── Public Routes ───────────────────────────────────────────────────────────
  .get("/", (c) => {
    return c.json({ message: "Examattic API is running" });
  })

  // ─── Admin-Only Route Example ────────────────────────────────────────────────
  .get("/api/admin/stats", requireAuth, requireRole("admin"), (c) => {
    return c.json({
      message: "Admin-only data",
      stats: { totalUsers: 42, activeToday: 12 },
    });
  })

  // ─── Student-Only Route Example ──────────────────────────────────────────────
  .get("/api/student/courses", requireAuth, requireRole("student"), (c) => {
    return c.json({
      message: "Student-only data",
      courses: [
        { id: 1, name: "Mathematics 101" },
        { id: 2, name: "Physics 201" },
      ],
    });
  });

// ─── Export ──────────────────────────────────────────────────────────────────
export type AppType = typeof routes;
export default app;
