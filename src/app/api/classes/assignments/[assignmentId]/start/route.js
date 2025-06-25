import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";
import { cookies } from "next/headers";
import crypto from "crypto";
import { get, set, redis } from "@/lib/redis";

export async function POST(req, { params }) {
    try {
        const db = new Database();
        const { assignmentId } = await params;

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
                { message: "Unauthorized" },
                { status: 403 }
            );
        }
        const userId = session.userId;

        // 1. Get the assignment's template environment
        const { rows: assignmentRows } = await db.execute`
            SELECT environment, name FROM assignments WHERE id = ${assignmentId}
        `;
        if (assignmentRows.length === 0) {
            return NextResponse.json(
                { message: "Assignment not found" },
                { status: 404 }
            );
        }
        const templateEnvId = assignmentRows[0].environment;
        const assignmentName = assignmentRows[0].name;

        // 2. Create a new environment for the student
        const newEnvId = crypto.randomUUID();
        const newEnvName = `${assignmentName} (Your Copy)`;

        await db.execute`
            INSERT INTO environments (id, name, owner)
            VALUES (${newEnvId}, ${newEnvName}, ${userId})
        `;

        // 3. Clone the files in Redis
        // All files for the template environment are named: <envId>_filename
        const templateKeys = await redis.keys(`${templateEnvId}_*`);
        for (const key of templateKeys) {
            const fileContent = await get(key);
            const filename = key.substring(templateEnvId.length + 1); // after the underscore
            const newKey = `${newEnvId}_${filename}`;
            await set(newKey, fileContent);
        }

        // 4. Insert into assignment_environments
        await db.execute`
            INSERT INTO assignment_environments (user_id, assignment, environment)
            VALUES (${userId}, ${assignmentId}, ${newEnvId})
        `;

        // 5. Return the new environment info
        return NextResponse.json(
            {
                message: "Assignment started",
                environment: {
                    id: newEnvId,
                    name: newEnvName,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error starting assignment:", error);
        return NextResponse.json(
            { message: "An error occurred while starting the assignment" },
            { status: 500 }
        );
    }
}
