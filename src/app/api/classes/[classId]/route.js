import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";

export async function GET(req, { params }) {
    try {
        const db = new Database();

        // Get classId from route params
        const classId = (await params).classId;

        // Get session token from cookies
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
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        // Check if the teacher is linked to this class
        let isTeacherForClass = false;
        if (session.role === "teacher") {
            const { rows } = await db.execute`
                SELECT 1 FROM teachers_classes_link
                WHERE teacher = ${session.teacherId} AND class = ${classId}
            `;
            isTeacherForClass = rows.length > 0;
        }

        let isStudentForClass = false;
        if (session.role === "user") {
            const { rows } = await db.execute`
                SELECT 1 FROM users_classes_link
                WHERE student = ${session.userId} AND class = ${classId}
            `;
            isStudentForClass = rows.length > 0;
        }

        if (!isTeacherForClass && !isStudentForClass) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Get class info
        const { rows: classRows } = await db.execute`
            SELECT id, name, description FROM classes WHERE id = ${classId}
        `;
        if (classRows.length === 0) {
            console.log("no class");
            return NextResponse.json(
                { message: "Class not found" },
                { status: 404 }
            );
        }
        const classInfo = classRows[0];

        // Get assignment count
        const { rows: assignmentRows } = await db.execute`
            SELECT COUNT(*)::int AS count FROM assignments WHERE class = ${classId}
        `;
        classInfo.assignment_count = assignmentRows[0]?.count || 0;

        return NextResponse.json({ class: classInfo }, { status: 200 });
    } catch (error) {
        console.error("Error fetching class info:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching class info" },
            { status: 500 }
        );
    }
}
