import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { SignJWT } from "jose"; // Using jose for JWT handling in Edge Runtime
import { Database } from "@/lib/DatabaseClasses";

export async function POST(req) {
    try {
        const { username, password } = await req.json();
        const db = new Database();

        // Fetch user from database
        const { rows: users } = await db.execute`
      SELECT * FROM users WHERE username = ${username}
    `;

        // Check if user exists
        if (!users.length) {
            return NextResponse.json(
                { message: "Incorrect username or password" },
                { status: 403 }
            );
        }

        const user = users[0];

        // Verify password
        const passwordCorrect = await bcrypt.compare(password, user.password);

        if (!passwordCorrect) {
            return NextResponse.json(
                { message: "Incorrect username or password" },
                { status: 403 }
            );
        }
        // Only insert session after successful authentication
        const insert =
            await db.execute`INSERT INTO sessions ("user") VALUES (${user.id}) RETURNING id`;

        let sessionId = insert.rows[0].id;

        // Create JWT token
        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create a JWT token
        const token = await new SignJWT({
            // Payload data
            userId: user.id,
            username: user.username,
            sessionId,
            role: user.role || "user",
        })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt() // When the token was issued
            .setExpirationTime(expiresAt) // When the token expires
            .setSubject(user.id.toString()) // Subject (user ID)
            .sign(new TextEncoder().encode(process.env.JWT_SECRET)); // Sign with secret key

        // Create response
        const response = NextResponse.json(
            {
                message: `Hello, ${username}`,
                user: {
                    id: user.id,
                    username: user.username,
                },
            },
            { status: 200 }
        );

        // Set the JWT token as a cookie
        response.cookies.set({
            name: "session_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Only use HTTPS in production
            sameSite: "lax",
            path: "/",
            expires: expiresAt,
        });

        return response;
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "An error occurred during login" },
            { status: 500 }
        );
    }
}
