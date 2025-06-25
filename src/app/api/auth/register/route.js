import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { Database } from "@/lib/DatabaseClasses";

export async function POST(req) {
    try {
        const { username, email, password, isTeacher } = await req.json();
        const db = new Database();

        // Check for existing username or email in both tables
        const userCheck = await db.execute`
            SELECT * FROM users WHERE username = ${username} OR email = ${email}
        `;
        const teacherCheck = await db.execute`
            SELECT * FROM teachers WHERE username = ${username} OR email = ${email}
        `;

        if (userCheck.rows.length || teacherCheck.rows.length) {
            return NextResponse.json(
                { message: "Username or email already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user/teacher
        let insert;
        if (isTeacher) {
            insert = await db.execute`
                INSERT INTO teachers (username, email, password)
                VALUES (${username}, ${email}, ${hashedPassword})
                RETURNING id, username
            `;
        } else {
            insert = await db.execute`
                INSERT INTO users (username, email, password)
                VALUES (${username}, ${email}, ${hashedPassword})
                RETURNING id, username
            `;
        }

        const newUser = insert.rows[0];

        // Create session
        const sessionInsert = await db.execute`
            INSERT INTO sessions ("user") VALUES (${newUser.id}) RETURNING id
        `;
        const sessionId = sessionInsert.rows[0].id;

        // Set expiration to 7 days from now
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        // Create JWT
        const tokenPayload = isTeacher
            ? {
                  teacherId: newUser.id,
                  username: newUser.username,
                  sessionId,
                  role: "teacher",
              }
            : {
                  userId: newUser.id,
                  username: newUser.username,
                  sessionId,
                  role: "user",
              };

        const token = await new SignJWT(tokenPayload)
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime(expiresAt)
            .setSubject(newUser.id.toString())
            .sign(new TextEncoder().encode(process.env.JWT_SECRET));

        // Create response
        const response = NextResponse.json(
            {
                message: `Welcome, ${username}`,
                [isTeacher ? "teacher" : "user"]: {
                    id: newUser.id,
                    username: newUser.username,
                },
            },
            { status: 201 }
        );

        // Set the JWT token as a cookie
        response.cookies.set({
            name: "session_token",
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
            path: "/",
            expires: expiresAt,
            domain:
                process.env.NODE_ENV === "production"
                    ? ".ajjs.co.uk"
                    : "localhost",
        });

        return response;
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json(
            { message: "An error occurred during signup" },
            { status: 500 }
        );
    }
}
