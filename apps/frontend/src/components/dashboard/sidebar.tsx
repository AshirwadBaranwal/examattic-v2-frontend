"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/lib/navigation";
import { useUIStore } from "@/stores/ui-store";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, GraduationCap, ShieldCheck, Sun, Moon } from "lucide-react";

interface SidebarProps {
    role: string;
    onSignOut: () => void;
}

export function Sidebar({ role, onSignOut }: SidebarProps) {
    const theme = useUIStore((s) => s.theme);
    const toggleTheme = useUIStore((s) => s.toggleTheme);
    const pathname = usePathname();
    const navItems = getNavItems(role);

    const RoleIcon = role === "admin" ? ShieldCheck : GraduationCap;

    return (
        <aside className="hidden md:flex h-screen w-18 flex-col border-r border-sidebar-border bg-background">
            {/* ─── Logo / Brand ─────────────────────────────────────── */}
            <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <RoleIcon className="size-6" />
                </div>
            </div>

            {/* ─── Navigation ──────────────────────────────────────── */}
            <nav className="flex-1 space-y-3 overflow-y-auto p-3 py-6 scrollbar-hide">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Tooltip key={item.href} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex h-10 w-10 items-center justify-center rounded-lg mx-auto transition-all",
                                        isActive
                                            ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                    )}
                                >
                                    <item.icon className="size-5 shrink-0" />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={12} className="font-semibold">
                                {item.title}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </nav>

            {/* ─── Footer ──────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-3 p-3 pb-6 shrink-0">
                <Separator className="w-10 mb-1" />

                {/* Theme toggle */}
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleTheme}
                            className="size-12 rounded-xl text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        >
                            {theme === "dark" ? (
                                <Sun className="size-5" />
                            ) : (
                                <Moon className="size-5" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="font-semibold">
                        {theme === "dark" ? "Light Mode" : "Dark Mode"}
                    </TooltipContent>
                </Tooltip>

                {/* Sign Out */}
                <Tooltip delayDuration={0}>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onSignOut}
                            className="size-12 rounded-xl text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
                        >
                            <LogOut className="size-5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12} className="font-semibold text-destructive">
                        Sign Out
                    </TooltipContent>
                </Tooltip>
            </div>
        </aside>
    );
}
