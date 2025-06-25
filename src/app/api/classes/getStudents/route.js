import { Database } from "@/lib/DatabaseClasses";
import { NextResponse } from "next/server";

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

        // Query for students in the class
        const students = await db.execute`
            SELECT u.*
            FROM users u
            JOIN users_classes_link ucl ON ucl.student = u.id
            WHERE ucl.class = ${classId}
        `;

        if (students.rows.length > 0) {
            return NextResponse.json(
                { message: "Success", students: students.rows },
                { status: 200 }
            );
        } else {
            return NextResponse.json(
                { message: "No students found for this class" },
                { status: 404 }
            );
        }
    } catch (error) {
        console.error("An error occurred", error);
        return NextResponse.json(
            { message: "An error occurred whilst fetching students" },
            { status: 500 }
        );
    }
}
