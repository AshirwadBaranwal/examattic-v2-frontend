"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui-store";

/**
 * Syncs the Zustand theme state with the DOM <html> class.
 * Must be rendered inside the root layout.
 */
export function ThemeSync() {
    const theme = useUIStore((s) => s.theme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle("dark", theme === "dark");
    }, [theme]);

    return null; // No UI — just a side-effect component
}
