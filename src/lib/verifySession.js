"use strict";

import { Database } from "./DatabaseClasses";
import { jwtVerify } from "jose";

// a server function to validate a session on the server

export async function verifySession(sessionToken) {
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload, protectedHeader } = await jwtVerify(
        sessionToken,
        secretKey
    );
    let sessionId = payload.sessionId;
    let userId = payload.userId;

    const db = new Database();
    const session =
        await db.execute`SELECT * FROM sessions WHERE id = ${sessionId} AND "user" = ${userId}`;

    if (session.rowCount !== 1) {
        return null;
    }

    return payload;
}
