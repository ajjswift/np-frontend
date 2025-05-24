import { Environment } from "@/classes/EnvironmentClasses";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/verifySession";
import { Database } from "@/lib/DatabaseClasses";
import {set} from '@/lib/redis';

export async function POST (req) {

    // Get the user's session from cookies
    const body = await req.json();
    console.log(body);
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!body?.name) {
        return NextResponse.json({message: 'Invalid parameters'}, {status: 422});
    }

    if (!token) {
        return NextResponse.json({message: 'Unauthorised'}, {status: 403})
    }

    const validToken = await verifySession(token);

    if (!validToken) {
        return NextResponse.json({message: 'Unauthorised'}, {status: 403})
    }



    let userId = validToken.userId;

    const db = new Database();

    const randomEnvironmentId = crypto.randomUUID();

    const insert = await db.execute`INSERT INTO environments (id, name, owner) VALUES (${randomEnvironmentId}, ${body.name}, ${userId})`;

    // Add the starting file to redis
    await set(`${randomEnvironmentId}_main.py`, '');

    return NextResponse.json({message: 'Success'}, {status: 200})
}