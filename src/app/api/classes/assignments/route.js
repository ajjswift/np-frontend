import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";

export async function POST(req) {
    try {
        const db = new Database();
        const body = await req.json();

        const { name, environment, class: classId } = body;

        if (!name || !environment || !classId) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 422 }
            );
        }

        // Get session token from cookies header
        const cookieHeader = req.headers.get("cookie") || "";
        const token = cookieHeader
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("session_token="))
            ?.split("=")[1];

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "teacher") {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        // Check teacher is linked to this class
        const { rows: teacherRows } = await db.execute`
            SELECT 1 FROM teachers_classes_link
            WHERE teacher = ${session.teacherId} AND class = ${classId}
        `;
        if (teacherRows.length === 0) {
            return NextResponse.json(
                { message: "You are not a teacher for this class" },
                { status: 403 }
            );
        }

        // Insert assignment
        await db.execute`
            INSERT INTO assignments (name, environment, class)
            VALUES (${name}, ${environment}, ${classId})
        `;

        return NextResponse.json(
            { message: "Assignment created" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating assignment:", error);
        return NextResponse.json(
            { message: "An error occurred while creating the assignment" },
            { status: 500 }
        );
    }
}
