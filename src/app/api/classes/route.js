import { Database } from "@/lib/DatabaseClasses";
import { isTeacher } from "@/lib/verifySession";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/verifySession";

export async function GET(req) {
    try {
        const db = new Database();

        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;

        const validSession = await verifySession(token);

        if (!validSession) {
            return NextResponse.json(
                {
                    message: "Unauthorized",
                },
                { status: 403 }
            );
        }

        const isUserTeacher = await isTeacher(token);

        if (!isUserTeacher) {
            // User is not a teacher.

            const classes = await db.execute`
            SELECT c.*
            FROM classes c
            JOIN users_classes_link ucl ON ucl.class = c.id
            WHERE ucl.student = ${validSession.userId}
        `;

            if (classes.rows.length > 0) {
                return NextResponse.json(
                    { message: "Success", classes: classes.rows },
                    { status: 200 }
                );
            } else {
                return NextResponse.json(
                    {
                        message: "No classes found",
                    },
                    { status: 404 }
                );
            }
        } else {
            // User is a teacher.

            const classes = await db.execute`
            SELECT c.*
            FROM classes c
            JOIN teachers_classes_link tcl ON tcl.class = c.id
            WHERE tcl.teacher = ${validSession.teacherId}
        `;

            if (classes.rows.length > 0) {
                return NextResponse.json(
                    { message: "Success", classes: classes.rows },
                    { status: 200 }
                );
            } else {
                return NextResponse.json(
                    {
                        message: "No classes found",
                    },
                    { status: 404 }
                );
            }
        }
    } catch (error) {
        console.error("An error occured", error);
        return NextResponse.json(
            { message: "An error occurred whilst fetching classes" },
            { status: 500 }
        );
    }
}
