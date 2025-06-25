import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";
import { cookies } from "next/headers";

export async function GET(req) {
    try {
        const db = new Database();

        // Get classId from query string
        const { searchParams } = new URL(req.url);
        const classId = searchParams.get("classId");

        if (!classId) {
            return NextResponse.json(
                { message: "Missing classId parameter" },
                { status: 400 }
            );
        }

        // Get session token from cookies header
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

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

        // Check if user is a teacher for the class
        let isAllowed = false;
        if (session.role === "teacher") {
            const { rows } = await db.execute`
                SELECT 1 FROM teachers_classes_link
                WHERE teacher = ${session.teacherId} AND class = ${classId}
            `;
            isAllowed = rows.length > 0;
        }

        // Or if user is a student in the class
        if (session.role === "user") {
            const { rows } = await db.execute`
                SELECT 1 FROM users_classes_link
                WHERE student = ${session.userId} AND class = ${classId}
            `;
            isAllowed = rows.length > 0;
        }

        if (!isAllowed) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        // Get assignments for the class
        const { rows: assignments } = await db.execute`
            SELECT id, name, environment, class
            FROM assignments
            WHERE class = ${classId}
            ORDER BY name
        `;

        // If student, check which assignments they've started
        if (session.role === "user") {
            // Get all assignment_environments for this user and these assignments
            const assignmentIds = assignments.map((a) => a.id);
            let startedMap = {};
            if (assignmentIds.length > 0) {
                const { rows: started } = await db.execute`
                    SELECT assignment, environment
                    FROM assignment_environments
                    WHERE user_id = ${session.userId}
                    AND assignment = ANY(${assignmentIds})
                `;
                for (const row of started) {
                    startedMap[row.assignment] = row.environment;
                }
            }
            // Add a "started" boolean and "environmentId" to each assignment
            assignments.forEach((a) => {
                a.started = !!startedMap[a.id];
                a.environmentId = startedMap[a.id] || null;
            });
        }

        return NextResponse.json({ assignments }, { status: 200 });
    } catch (error) {
        console.error("Error fetching assignments:", error);
        return NextResponse.json(
            { message: "An error occurred while fetching assignments" },
            { status: 500 }
        );
    }
}
