import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";
import { cookies } from "next/headers";

export async function GET(req, { params }) {
    try {
        const db = new Database();
        const { assignmentId } = await params;
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");

        if (!classId) {
            return NextResponse.json(
                { error: "Missing classId parameter" },
                { status: 400 }
            );
        }

        // Get session token from cookies header
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const session = await verifySession(token);
        if (!session) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check access
        if (session.role === "teacher") {
            const { rows: teacherRows } = await db.execute`
                SELECT 1 FROM teachers_classes_link
                WHERE teacher = ${session.teacherId} AND class = ${classId}
            `;
            if (teacherRows.length === 0) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Access denied" },
                { status: 403 }
            );
        }

        // Get all assignment_environments for this assignment and class
        const { rows } = await db.execute`
            SELECT user_id as student_id, environment FROM assignment_environments WHERE assignment = ${assignmentId}
        `;
        console.log(rows);

        let studentEnvMap = {};

        for (let row of rows) {
            studentEnvMap[row.student_id] = row.environment;
        }

        console.log(studentEnvMap);

        // Return as array of { student, environmentId }
        return NextResponse.json(studentEnvMap);
    } catch (error) {
        console.error("Error fetching assignment progress:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
