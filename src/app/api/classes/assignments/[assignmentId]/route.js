import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";
import { cookies } from "next/headers";

export async function GET(req, { params }) {
    try {
        const db = new Database();
        const { assignmentId } = await params;

        // Get session token from cookies header
        const cookieHeader = req.headers.get("cookie") || "";
        const token = cookieHeader
            .split(";")
            .map((c) => c.trim())
            .find((c) => c.startsWith("session_token="))
            ?.split("=")[1];

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

        // Get assignment details
        const { rows } = await db.execute`
            SELECT 
                a.id, 
                a.name, 
                a.environment, 
                a.class,
                c.name AS class_name,
                e.name AS environment_name
            FROM assignments a
            LEFT JOIN classes c ON a.class = c.id
            LEFT JOIN environments e ON a.environment = e.id
            WHERE a.id = ${assignmentId}
        `;

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "Assignment not found" },
                { status: 404 }
            );
        }

        // Check access
        if (session.role === "teacher") {
            const { rows: teacherRows } = await db.execute`
                SELECT 1 FROM teachers_classes_link
                WHERE teacher = ${session.teacherId} AND class = ${rows[0].class}
            `;
            if (teacherRows.length === 0) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 }
                );
            }
        } else {
            const { rows: studentRows } = await db.execute`
                SELECT 1 FROM users_classes_link
                WHERE user_id = ${session.userId} AND class_id = ${rows[0].class}
            `;
            if (studentRows.length === 0) {
                return NextResponse.json(
                    { error: "Access denied" },
                    { status: 403 }
                );
            }
        }

        return NextResponse.json({ assignment: rows[0] });
    } catch (error) {
        console.error("Error fetching assignment details:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
