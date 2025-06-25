import { NextResponse } from "next/server";
import { Database } from "@/lib/DatabaseClasses";
import { verifySession } from "@/lib/verifySession";
import { cookies } from "next/headers";
import crypto from "crypto";
import { get, set, redis } from "@/lib/redis";

export async function POST(req, { params }) {
    try {
        const db = new Database();
        const { assignmentId } = params;
        console.log("[API] Start assignment POST", { assignmentId });

        // Get session token from cookies
        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;
        console.log("[API] session_token from cookies:", token);

        if (!token) {
            console.warn("[API] No session token found in cookies");
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }

        const session = await verifySession(token);
        console.log("[API] Session after verifySession:", session);

        if (!session || session.role !== "user") {
            console.warn("[API] Invalid session or not a user", { session });
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 403 }
            );
        }
        const userId = session.userId;
        console.log("[API] userId from session:", userId);

        // 1. Get the assignment's template environment
        const { rows: assignmentRows } = await db.execute`
            SELECT environment, name FROM assignments WHERE id = ${assignmentId}
        `;
        console.log("[API] assignmentRows:", assignmentRows);

        if (assignmentRows.length === 0) {
            console.warn("[API] Assignment not found", { assignmentId });
            return NextResponse.json(
                { message: "Assignment not found" },
                { status: 404 }
            );
        }
        const templateEnvId = assignmentRows[0].environment;
        const assignmentName = assignmentRows[0].name;
        console.log(
            "[API] templateEnvId:",
            templateEnvId,
            "assignmentName:",
            assignmentName
        );

        // 2. Create a new environment for the student
        const newEnvId = crypto.randomUUID();
        const newEnvName = `${assignmentName} (Your Copy)`;
        console.log("[API] newEnvId:", newEnvId, "newEnvName:", newEnvName);

        await db.execute`
            INSERT INTO environments (id, name, owner)
            VALUES (${newEnvId}, ${newEnvName}, ${userId})
        `;
        console.log("[API] Inserted new environment");

        // 3. Clone the files in Redis
        // All files for the template environment are named: <envId>_filename
        const templateKeys = await redis.keys(`${templateEnvId}_*`);
        console.log("[API] Redis templateKeys:", templateKeys);

        for (const key of templateKeys) {
            const fileContent = await get(key);
            const filename = key.substring(templateEnvId.length + 1); // after the underscore
            const newKey = `${newEnvId}_${filename}`;
            await set(newKey, fileContent);
            console.log(`[API] Cloned file: ${key} -> ${newKey}`);
        }

        // 4. Insert into assignment_environments
        await db.execute`
            INSERT INTO assignment_environments (user_id, assignment, environment)
            VALUES (${userId}, ${assignmentId}, ${newEnvId})
        `;
        console.log("[API] Inserted into assignment_environments");

        // 5. Return the new environment info
        console.log("[API] Assignment started successfully", {
            environment: { id: newEnvId, name: newEnvName },
        });
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
        console.error("Error starting assignment:", error, {
            stack: error?.stack,
            message: error?.message,
        });
        return NextResponse.json(
            { message: "An error occurred while starting the assignment" },
            { status: 500 }
        );
    }
}
