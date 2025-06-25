import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";
import { cookies } from "next/headers";

export async function POST(req) {
    try {
        const db = new Database();
        const body = await req.json();
        const classId = body.classId || body.code; // support both "classId" and "code"

        if (!classId) {
            return NextResponse.json(
                { message: "Missing classId or code" },
                { status: 400 }
            );
        }

        // Get session token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const session = await verifySession(token);
        if (!session || session.role !== "user") {
            return NextResponse.json(
                { message: "Only students can join classes" },
                { status: 403 }
            );
        }
        const userId = session.userId;

        // Check if already joined
        const { rows: existing } = await db.execute`
            SELECT 1 FROM users_classes_link
            WHERE student = ${userId} AND class = ${classId}
        `;
        if (existing.length > 0) {
            return NextResponse.json(
                { message: "You are already enrolled in this class." },
                { status: 200 }
            );
        }

        // Insert the join record
        await db.execute`
            INSERT INTO users_classes_link (student, class)
            VALUES (${userId}, ${classId})
        `;

        return NextResponse.json(
            { message: "Successfully joined the class." },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error joining class:", error);
        return NextResponse.json(
            { message: "An error occurred while joining the class." },
            { status: 500 }
        );
    }
}
