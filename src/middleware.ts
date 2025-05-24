// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Paths that require authentication
const PROTECTED_PATHS = ["/dashboard"];

// Paths that should redirect to dashboard if user is already logged in
const AUTH_PATHS = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if the path requires authentication
    const isProtectedPath = PROTECTED_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Check if the path is an auth path (login/register)
    const isAuthPath = AUTH_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Get the session token from cookies
    const token = request.cookies.get("session_token")?.value;

    // If there's no token and the path is protected
    if (!token && isProtectedPath) {
        // Redirect to login page
        const url = new URL("/auth/login", request.url);
        url.searchParams.set("from", pathname);
        return NextResponse.redirect(url);
    }

    // If there is a token
    if (token) {
        try {
            // Verify the JWT token
            // Make sure JWT_SECRET is properly set in your environment variables
            const secret = new TextEncoder().encode(process.env.JWT_SECRET);
            const { payload } = await jwtVerify(token, secret);

            // If token is valid and user is trying to access auth pages
            if (isAuthPath) {
                // Redirect already logged in users to dashboard
                return NextResponse.redirect(
                    new URL("/dashboard", request.url)
                );
            }

            // For valid tokens on protected routes, continue but attach user info
            if (isProtectedPath) {
                // Add user info to request headers
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set("x-user-id", payload.sub as string);

                return NextResponse.next({
                    request: {
                        headers: requestHeaders,
                    },
                });
            }
        } catch (error) {
            console.error("Token validation error:", error);

            // If token is invalid and path is protected
            if (isProtectedPath) {
                // Clear the invalid cookie and redirect to login
                const response = NextResponse.redirect(
                    new URL("/auth/login", request.url)
                );
                response.cookies.delete("session_token");
                return response;
            }
        }
    }

    // For all other cases, continue normally
    return NextResponse.next();
}

// Configure the middleware to run on all paths except those specified
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public (public files)
         */
        "/((?!api/|_next/static|_next/image|favicon.ico|public/).*)",
    ],
};
