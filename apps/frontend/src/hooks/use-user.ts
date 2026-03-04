import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { queryKeys } from "@/lib/query-keys";
import { api } from "@/lib/api-client";
import { useSession, signOut as authSignOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserData {
    id: string;
    name: string;
    email: string;
    role: string;
    image: string | null;
    banned: boolean | null;
}

// ─── useUser Hook ─────────────────────────────────────────────────────────────
// Merges better-auth session with the /api/me endpoint for full user data.
// Cached by TanStack Query — available on every route without re-fetching.
export function useUser() {
    const { data: session, isPending: isSessionPending } = useSession();
    const queryClient = useQueryClient();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    const query = useQuery({
        queryKey: queryKeys.user.me,
        queryFn: async (): Promise<UserData> => {
            const res = await api.api.me.$get();

            if (!res.ok) {
                throw new Error("Failed to fetch user data");
            }

            const data = await res.json();
            const user = data.user;

            if (!user) {
                throw new Error("No user data");
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role ?? "student",
                image: user.image ?? null,
                banned: user.banned ?? null,
            };
        },
        // Only fetch when we have a session
        enabled: !!session && !isSessionPending,
        // Cache user data for 5 minutes, but refetch in background
        staleTime: 5 * 60 * 1000,
        // Keep old data while refetching
        placeholderData: (prev) => prev,
        // Retry once on failure (e.g., brief network blip)
        retry: 1,
        // Don't refetch on window focus too aggressively
        refetchOnWindowFocus: false,
    });

    // ─── Logout helper that clears all caches ────────────────
    const logout = useCallback(async () => {
        setLoggingOut(true);
        try {
            await authSignOut();
            // Clear ALL query caches on logout for security
            queryClient.clear();
            router.replace("/");
        } catch {
            // Even on error, redirect to home
            router.replace("/");
        }
    }, [queryClient, router]);

    // ─── Invalidate user data (e.g., after profile update) ───
    const invalidateUser = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    }, [queryClient]);

    return {
        user: query.data ?? null,
        isLoading: isSessionPending || query.isLoading,
        isError: query.isError,
        error: query.error,
        logout,
        loggingOut,
        invalidateUser,
        // Direct session access for auth state checks
        isAuthenticated: !!session,
        session,
    };
}

