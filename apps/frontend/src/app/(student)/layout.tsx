"use client";

import { useUser } from "@/hooks/use-user";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LogoutOverlay } from "@/components/dashboard/logout-overlay";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, isAuthenticated, logout, loggingOut } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace("/login");
        }
        if (!isLoading && user && user.role !== "student") {
            router.replace("/" + user.role + "/dashboard");
        }
    }, [user, isLoading, isAuthenticated, router]);

    if (loggingOut) {
        return <LogoutOverlay />;
    }

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
        );
    }

    if (!user || user.role !== "student") {
        return null;
    }

    return (
        <DashboardShell
            userName={user.name}
            userEmail={user.email}
            userImage={user.image}
            role="student"
            onSignOut={logout}
        >
            {children}
        </DashboardShell>
    );
}

