import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
    // ─── Theme ─────────────────────────────────────────
    theme: "light" | "dark";
    setTheme: (theme: "light" | "dark") => void;
    toggleTheme: () => void;

    // ─── Sidebar ───────────────────────────────────────
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
    toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Theme
            theme: "dark",
            setTheme: (theme) => {
                if (typeof document !== "undefined") {
                    document.documentElement.classList.toggle("dark", theme === "dark");
                }
                set({ theme });
            },
            toggleTheme: () =>
                set((s) => {
                    const next = s.theme === "dark" ? "light" : "dark";
                    if (typeof document !== "undefined") {
                        document.documentElement.classList.toggle("dark", next === "dark");
                    }
                    return { theme: next };
                }),

            // Sidebar
            sidebarCollapsed: false,
            setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
            toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        }),
        {
            name: "examattic-ui", // localStorage key
            partialize: (state) => ({
                theme: state.theme,
                sidebarCollapsed: state.sidebarCollapsed,
            }),
        }
    )
);
