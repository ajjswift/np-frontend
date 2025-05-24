import { NextResponse } from "next/server";
import { verifySession } from "@/lib/verifySession";
import { Database } from "@/lib/DatabaseClasses";

export const GET = async (request) => {
    const sessionToken = await request.cookies.get("session_token")?.value;

    const validSession = await verifySession(sessionToken);

    if (!validSession) {
        return NextResponse.json(
            { message: "Invalid session" },
            { status: 401 } // Unauthorized status
        );
    }

    const db = new Database();
    const environments =
        await db.execute`SELECT * FROM environments WHERE owner = ${validSession.userId}`;

    return NextResponse.json(
        { message: "Success", environments: environments.rows },
        { status: 200 }
    );
};
