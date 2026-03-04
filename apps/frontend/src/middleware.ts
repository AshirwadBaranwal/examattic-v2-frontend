import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Get the session token cookie (better-auth uses this name)
    const sessionToken =
        request.cookies.get("better-auth.session_token")?.value;

    const isPublicRoute = publicRoutes.includes(pathname);
    const isStudentRoute = pathname.startsWith("/student");
    const isAdminRoute = pathname.startsWith("/admin");

    // If no session token and trying to access protected routes → redirect to login
    if (!sessionToken && (isStudentRoute || isAdminRoute)) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // No token on public route → let it through immediately (no backend call needed)
    if (!sessionToken && isPublicRoute) {
        return NextResponse.next();
    }

    // If there's a session token, fetch the session from the backend to get the role
    if (sessionToken) {
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8787";
            const res = await fetch(
                backendUrl + "/api/auth/get-session",
                {
                    headers: {
                        cookie: "better-auth.session_token=" + sessionToken,
                    },
                }
            );

            if (res.ok) {
                const session = (await res.json()) as { user?: { role?: string } } | null;
                const role = session?.user?.role || "student";

                // Logged-in user on public routes → redirect to their dashboard
                if (isPublicRoute) {
                    return NextResponse.redirect(
                        new URL("/" + role + "/dashboard", request.url)
                    );
                }

                // Student on admin routes → redirect to student dashboard
                if (isAdminRoute && role !== "admin") {
                    return NextResponse.redirect(
                        new URL("/" + role + "/dashboard", request.url)
                    );
                }

                // Admin on student routes → redirect to admin dashboard
                if (isStudentRoute && role !== "student") {
                    return NextResponse.redirect(
                        new URL("/" + role + "/dashboard", request.url)
                    );
                }
            } else {
                // Session invalid — clear it and redirect to login for protected routes
                if (isStudentRoute || isAdminRoute) {
                    const response = NextResponse.redirect(
                        new URL("/login", request.url)
                    );
                    response.cookies.delete("better-auth.session_token");
                    return response;
                }
            }
        } catch (_error) {
            // Backend unreachable — don't block, let client-side handle it
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
