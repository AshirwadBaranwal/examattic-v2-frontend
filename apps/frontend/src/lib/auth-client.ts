import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export const authClient = createAuthClient({
    baseURL: API_URL,
    plugins: [
        adminClient()
    ],
    fetchOptions: {
        credentials: "include", // Send cookies cross-origin
    },
});

// Convenience exports
export const {
    signIn,
    signUp,
    signOut,
    useSession,
} = authClient;
