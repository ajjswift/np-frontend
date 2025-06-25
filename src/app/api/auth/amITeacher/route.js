import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isTeacher } from "@/lib/verifySession";

export async function GET() {
    try {
        // Get the token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

        if (!token) {
            return NextResponse.json({ authenticated: false }, { status: 401 });
        }

        const isUserTeacher = await isTeacher(token);

        // Return user data from the token
        return NextResponse.json(
            {
                isTeacher: isUserTeacher,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Teacher checking error:", error);
        return NextResponse.json({ authenticated: false }, { status: 500 });
    }
}
