import { NextResponse } from "next/server";
import { isTeacher, verifySession } from "@/lib/verifySession";
import { Database } from "@/lib/DatabaseClasses";

export const GET = async (request) => {
    try {
        const sessionToken = await request.cookies.get("session_token")?.value;

        const validSession = await verifySession(sessionToken);

        if (!validSession) {
            return NextResponse.json(
                { message: "Invalid session" },
                { status: 401 } // Unauthorized status
            );
        }

        const db = new Database();

        let userId = validSession?.userId;
        if (await isTeacher(sessionToken)) {
            userId = validSession.teacherId;
        }

        const environments =
            await db.execute`SELECT * FROM environments WHERE owner = ${userId}`;

        return NextResponse.json(
            { message: "Success", environments: environments.rows },
            { status: 200 }
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { message: "An error occured" },
            { status: 500 }
        );
    }
};
