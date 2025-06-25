import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { Database } from "@/lib/DatabaseClasses";

export async function POST(req) {
    try {
        const { username, password } = await req.json();
        const db = new Database();

        // Try user login first
        const { rows: users } = await db.execute`
            SELECT * FROM users WHERE username = ${username}
        `;

        if (users.length) {
            return await completeUserLogin(username, password, users);
        } else {
            // Try teacher login if not found in users
            return await completeTeacherLogin(username, password);
        }
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "An error occurred during login" },
            { status: 500 }
        );
    }
}

async function completeUserLogin(username, password, users) {
    const db = new Database();
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

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create a JWT token
    const token = await new SignJWT({
        userId: user.id,
        username: user.username,
        sessionId,
        role: "user",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .setSubject(user.id.toString())
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

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
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
        expires: expiresAt,
        domain:
            process.env.NODE_ENV === "production" ? ".ajjs.co.uk" : "localhost",
    });

    return response;
}

async function completeTeacherLogin(username, password) {
    const db = new Database();

    // Fetch teacher from database
    const { rows: teachers } = await db.execute`
        SELECT * FROM teachers WHERE username = ${username}
    `;

    if (!teachers.length) {
        return NextResponse.json(
            { message: "Incorrect username or password" },
            { status: 403 }
        );
    }

    const teacher = teachers[0];

    // Verify password
    const passwordCorrect = await bcrypt.compare(password, teacher.password);

    if (!passwordCorrect) {
        return NextResponse.json(
            { message: "Incorrect username or password" },
            { status: 403 }
        );
    }

    // Only insert session after successful authentication
    const insert =
        await db.execute`INSERT INTO sessions ("user") VALUES (${teacher.id}) RETURNING id`;

    let sessionId = insert.rows[0].id;

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create a JWT token
    const token = await new SignJWT({
        teacherId: teacher.id,
        username: teacher.username,
        sessionId,
        role: "teacher",
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(expiresAt)
        .setSubject(teacher.id.toString())
        .sign(new TextEncoder().encode(process.env.JWT_SECRET));

    // Create response
    const response = NextResponse.json(
        {
            message: `Hello, ${username}`,
            teacher: {
                id: teacher.id,
                username: teacher.username,
            },
        },
        { status: 200 }
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
            process.env.NODE_ENV === "production" ? ".ajjs.co.uk" : "localhost",
    });

    return response;
}
