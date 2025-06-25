"use strict";

import { Database } from "./DatabaseClasses";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

// a server function to validate a session on the server

export async function verifySession(sessionToken) {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(sessionToken, secretKey);

    const sessionId = payload.sessionId;
    const role = payload.role;

    const db = new Database();

    let session;
    if (role === "teacher") {
        const teacherId = payload.teacherId;
        session = await db.execute`
            SELECT * FROM sessions WHERE id = ${sessionId} AND "user" = ${teacherId}
        `;
    } else if (role === "user") {
        const userId = payload.userId;
        session = await db.execute`
            SELECT * FROM sessions WHERE id = ${sessionId} AND "user" = ${userId}
        `;
    } else {
        // Unknown role
        return null;
    }

    if (session.rowCount !== 1) {
        return null;
    }

    return payload;
}

export async function isTeacher(sessionToken) {
    if (!sessionToken) return false;

    try {
        const { payload } = await jwtVerify(
            sessionToken,
            new TextEncoder().encode(process.env.JWT_SECRET)
        );
        return payload.role === "teacher";
    } catch (e) {
        // Invalid or expired token
        return false;
    }
}