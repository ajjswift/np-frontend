// app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export async function POST() {
    const response = NextResponse.json(
        {
            message: "Logged out.",
        },
        { status: 200 }
    );

    // Delete the cookie using the same pattern as when setting it
    response.cookies.set({
        name: "session_token",
        value: "", // Empty value
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        expires: new Date(0), // Set expiration to the past
    });

    return response;
}
