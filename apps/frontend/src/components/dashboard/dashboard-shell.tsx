"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { BottomNav } from "@/components/dashboard/bottom-nav";
import { TooltipProvider } from "@/components/ui/tooltip";

interface DashboardShellProps {
    children: React.ReactNode;
    userName: string;
    userEmail: string;
    userImage?: string | null;
    role: string;
    onSignOut: () => void;
}

export function DashboardShell({
    children,
    userName,
    userEmail,
    userImage,
    role,
    onSignOut,
}: DashboardShellProps) {
    return (
        <TooltipProvider>
            <div className="flex h-screen overflow-hidden bg-background">
                <Sidebar role={role} onSignOut={onSignOut} />
                <div className="flex flex-1 flex-col overflow-hidden ">
                    <Header
                        userName={userName}
                        userEmail={userEmail}
                        userImage={userImage}
                        role={role}
                        onSignOut={onSignOut}
                    />
                    <main className="flex-1 overflow-y-auto  bg-accent/20">{children}</main>
                </div>
                <BottomNav role={role} />
            </div>
        </TooltipProvider>
    );
}
