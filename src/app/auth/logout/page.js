"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
    const router = useRouter();

    useEffect(() => {
        async function performLogout() {
            try {
                // Call your API route
                const response = await fetch("/api/auth/logout", {
                    method: "POST",
                    credentials: "include", // Important for cookies
                });

                if (response.ok) {
                    console.log("Logged out successfully");
                } else {
                    console.error("Logout failed");
                }
            } catch (error) {
                console.error("Error during logout:", error);
            }

            // Redirect regardless of success/failure
            router.push("/auth/login");
        }

        performLogout();
    }, [router]);
}
