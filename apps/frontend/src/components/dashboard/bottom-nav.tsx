"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavItems } from "@/lib/navigation";

interface BottomNavProps {
    role: string;
}

export function BottomNav({ role }: BottomNavProps) {
    const pathname = usePathname();
    const navItems = getNavItems(role);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-[72px] items-center justify-around border-t border-border bg-background/80 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-xl">
            {navItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center justify-center gap-1 min-w-[64px] p-1 transition-all"
                    >
                        <div
                            className={cn(
                                "flex h-8 w-14 items-center justify-center rounded-xl transition-all",
                                isActive ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" : "bg-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="size-5" />
                        </div>
                        <span
                            className={cn(
                                "text-[10px] font-medium transition-all",
                                isActive ? "text-primary" : "text-muted-foreground"
                            )}
                        >
                            {item.title}
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}
