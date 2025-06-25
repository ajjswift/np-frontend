import { Environment } from "@/classes/EnvironmentClasses";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { isTeacher, verifySession } from "@/lib/verifySession";
import { Database } from "@/lib/DatabaseClasses";
import { set } from "@/lib/redis";

export async function POST(req) {
    try {
        // Get the user's session from cookies
        const body = await req.json();
        console.log(body);

        const cookieStore = await cookies();
        const token = cookieStore.get("session_token")?.value;
        console.log(token);
        console.log("hello");

        if (!body?.name) {
            return NextResponse.json(
                { message: "Invalid parameters" },
                { status: 422 }
            );
        }

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 403 }
            );
        }

        const validToken = await verifySession(token);

        if (!validToken) {
            return NextResponse.json(
                { message: "Unauthorised" },
                { status: 403 }
            );
        }

        const isUserTeacher = await isTeacher(token);
        let userId = validToken?.userId;
        if (isUserTeacher) {
            userId = validToken.teacherId;
        }

        console.log("....");
        console.log(`hello: ${userId}`);

        const db = new Database();

        const randomEnvironmentId = crypto.randomUUID();

        try {
            await db.execute`
                INSERT INTO environments (id, name, owner)
                VALUES (${randomEnvironmentId}, ${body.name}, ${userId})
            `;
        } catch (dbError) {
            console.error("Database error:", dbError);
            return NextResponse.json(
                { message: "Database error" },
                { status: 500 }
            );
        }

        // Add the starting file to redis
        try {
            await set(`${randomEnvironmentId}_main.py`, "");
        } catch (redisError) {
            console.error("Redis error:", redisError);
            return NextResponse.json(
                { message: "Redis error" },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: "Success" }, { status: 200 });
    } catch (error) {
        console.error("An error occurred:", error);
        return NextResponse.json(
            { message: "An error occurred while creating the environment" },
            { status: 500 }
        );
    }
}
