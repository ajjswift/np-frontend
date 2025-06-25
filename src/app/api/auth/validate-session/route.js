import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function GET() {
    try {
        // Get the token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        // Verify the JWT token
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        // Return user data from the token
        return NextResponse.json({
            authenticated: true,
            user: {
                id: payload.sub,
                username: payload.username,
                role: payload.role,
            },
        });
    } catch (error) {
        console.error("Session validation error:", error);
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
}
