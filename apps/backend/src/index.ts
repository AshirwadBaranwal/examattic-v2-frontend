import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./lib/auth";
import {
  sessionMiddleware,
  requireAuth,
  requireRole,
} from "./middleware/auth";
import { globalErrorHandler, sanitizeAuthError } from "./middleware/error-handler";

// ─── App Type ────────────────────────────────────────────────────────────────
type Bindings = {
  DATABASE_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

type Variables = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string | null;
    image: string | null;
    banned: boolean | null;
    [key: string]: unknown;
  } | null;
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    [key: string]: unknown;
  } | null;
  auth: ReturnType<typeof createAuth>;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// ─── Global Error Handler ────────────────────────────────────────────────────
// Catches ALL uncaught errors — ensures no internal details ever leak to client
app.onError(globalErrorHandler);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: "NOT_FOUND",
      message: "The requested endpoint does not exist.",
    },
    404
  );
});

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(
  "*",
  cors({
    origin: "http://localhost:3000",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// ─── Auth Instance Middleware ────────────────────────────────────────────────
// Creates the auth instance per-request (required for Workers env bindings)
app.use("*", async (c, next) => {
  const auth = createAuth({
    DATABASE_URL: c.env.DATABASE_URL,
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
  });
  c.set("auth", auth);
  await next();
});

// ─── Better Auth Handler ─────────────────────────────────────────────────────
app.on(["POST", "GET"], "/api/auth/**", async (c) => {
  const auth = c.get("auth");
  const response = await auth.handler(c.req.raw);

  // Intercept error responses from better-auth and sanitize them
  if (!response.ok) {
    try {
      const cloned = response.clone();
      const body = await cloned.json() as any;

      if (body?.code || body?.message) {
        const { status, body: safeBody } = sanitizeAuthError(body.code, body.message);
        return c.json(safeBody, status as any);
      }
    } catch {
      // If we can't parse the response, just pass it through
    }
  }

  return response;
});

// ─── Session Middleware (for all /api routes except auth) ────────────────────
app.use("/api/*", sessionMiddleware);

// ─── Public Routes ───────────────────────────────────────────────────────────
app.get("/", (c) => {
  return c.json({ message: "Examattic API is running" });
});

// ─── Protected Route: Get Current User ───────────────────────────────────────
app.get("/api/me", requireAuth, (c) => {
  const user = c.get("user");
  const session = c.get("session");
  return c.json({ user, session });
});

// ─── Admin-Only Route Example ────────────────────────────────────────────────
app.get("/api/admin/stats", requireAuth, requireRole("admin"), (c) => {
  return c.json({
    message: "Admin-only data",
    stats: { totalUsers: 42, activeToday: 12 },
  });
});

// ─── Student-Only Route Example ──────────────────────────────────────────────
app.get("/api/student/courses", requireAuth, requireRole("student"), (c) => {
  return c.json({
    message: "Student-only data",
    courses: [
      { id: 1, name: "Mathematics 101" },
      { id: 2, name: "Physics 201" },
    ],
  });
});

export default app;
