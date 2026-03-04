"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User, Sun, Moon, ShieldCheck, GraduationCap } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

interface HeaderProps {
    userName: string;
    userEmail: string;
    userImage?: string | null;
    role: string;
    onSignOut: () => void;
}

export function Header({ userName, userEmail, userImage, role, onSignOut }: HeaderProps) {
    const theme = useUIStore((s) => s.theme);
    const toggleTheme = useUIStore((s) => s.toggleTheme);

    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const RoleIcon = role === "admin" ? ShieldCheck : GraduationCap;

    return (
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-sm">
            {/* Left side */}
            <div className="flex items-center gap-3">
                {/* Mobile Logo */}
                <div className="md:hidden flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                        <RoleIcon className="size-5" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">Examattic</span>
                </div>
                {/* Desktop Welcome */}
                <h2 className="hidden md:block text-sm font-medium text-foreground/80">
                    Welcome back,{" "}
                    <span className="font-semibold text-foreground">{userName}</span>
                </h2>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <Button variant="ghost" size="icon" onClick={toggleTheme} className="size-8">
                    {theme === "dark" ? (
                        <Sun className="size-4" />
                    ) : (
                        <Moon className="size-4" />
                    )}
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative size-8 rounded-full">
                            <Avatar className="size-8">
                                <AvatarImage src={userImage ?? undefined} alt={userName} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{userName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {userEmail}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <User className="mr-2 size-4" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Settings className="mr-2 size-4" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onSignOut}
                            className="text-destructive focus:text-destructive"
                        >
                            <LogOut className="mr-2 size-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
