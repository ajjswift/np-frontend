import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const { name, description } = await req.json();
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get("session_token")?.value;

        if (!name) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify session token
        let teacherId;
        try {
            const { payload } = await jwtVerify(
                sessionToken,
                new TextEncoder().encode(process.env.JWT_SECRET)
            );
            if (payload.role !== "teacher" || !payload.teacherId) {
                return NextResponse.json(
                    { message: "Not authorized" },
                    { status: 403 }
                );
            }
            teacherId = payload.teacherId;
        } catch (err) {
            return NextResponse.json(
                { message: "Invalid or expired session token" },
                { status: 401 }
            );
        }

        const db = new Database();

        // 1. Create the class
        const classInsert = await db.execute`
            INSERT INTO classes (name, description)
            VALUES (${name}, ${description})
            RETURNING id, name, description
        `;
        const newClass = classInsert.rows[0];

        // 2. Link teacher to class
        await db.execute`
            INSERT INTO teachers_classes_link (teacher, class)
            VALUES (${teacherId}, ${newClass.id})
        `;

        return NextResponse.json(
            {
                message: "Class created successfully",
                class: newClass,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Create class error:", error);
        return NextResponse.json(
            { message: "An error occurred while creating the class" },
            { status: 500 }
        );
    }
}
