"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const searchParams = useSearchParams();
    const from = searchParams.get("from");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Redirect on success
            if (from !== "" && from !== null) {
                router.push(decodeURIComponent(from));
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900 transition-colors">
            <div className="w-full max-w-md space-y-8 rounded-lg bg-white dark:bg-zinc-800 p-8 shadow-md dark:shadow-zinc-900 transition-colors">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">
                        Sign in to your account
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="username" className="sr-only">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                className="relative block w-full appearance-none rounded-none rounded-t-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 placeholder-zinc-500 dark:placeholder-zinc-400 focus:z-10 focus:border-zinc-500 focus:ring-zinc-500 focus:outline-none sm:text-sm transition-colors"
                                placeholder="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full appearance-none rounded-none rounded-b-md border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 placeholder-zinc-500 dark:placeholder-zinc-400 focus:z-10 focus:border-zinc-500 focus:ring-zinc-500 focus:outline-none sm:text-sm transition-colors"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-center text-sm text-red-500 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="text-sm">
                            <Link
                                href="/forgot-password"
                                className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                            >
                                Forgot your password?
                            </Link>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-zinc-900 dark:bg-zinc-100 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300 focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50 transition-colors"
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </form>
                <div className="mt-4 text-center">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                        Don't have an account?{" "}
                        <Link
                            href="/auth/register"
                            className="font-medium text-zinc-700 dark:text-zinc-100 hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm />
        </Suspense>
    );
}
