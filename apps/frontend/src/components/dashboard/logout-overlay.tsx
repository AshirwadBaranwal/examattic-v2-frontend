"use client";

import { Loader2, LogOut } from "lucide-react";

// ─── Logout Overlay ──────────────────────────────────────────────────────────
// Full-screen animated overlay shown during sign-out.
// Uses CSS animations for a smooth, premium feel.

export function LogoutOverlay() {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="flex flex-col items-center gap-5 animate-in zoom-in-95 duration-500">
                {/* Animated icon container */}
                <div className="relative flex items-center justify-center">
                    {/* Pulsing ring */}
                    <div className="absolute size-16 animate-ping rounded-full bg-primary/10" />
                    <div className="relative flex size-14 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                        <LogOut className="size-6 text-primary animate-in slide-out-to-right-1 duration-700" />
                    </div>
                </div>

                {/* Text */}
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground tracking-tight">
                        Signing out
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Clearing your session securely&hellip;
                    </p>
                </div>

                {/* Spinner */}
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        </div>
    );
}
