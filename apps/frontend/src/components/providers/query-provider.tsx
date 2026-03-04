"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Don't refetch on window focus in dev (annoying)
                refetchOnWindowFocus: false,
                // Retry once on failure
                retry: 1,
                // Data is fresh for 1 minute by default
                staleTime: 60 * 1000,
            },
            mutations: {
                // Show errors through the hook, not via thrown errors
                onError: (error) => {
                    console.error("[Mutation Error]", error.message);
                },
            },
        },
    });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Create one QueryClient per component lifecycle (SSR-safe)
    const [queryClient] = useState(makeQueryClient);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
