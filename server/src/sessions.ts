import crypto from "node:crypto";
import type { Response } from "express";
import { pool } from "./db.js";

export async function createSession(userId: number, res: Response)  {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + (45 * 60 * 1000));
    await pool.query("INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)", [userId, token, expiresAt]);
    res.cookie("session", token, { expires: expiresAt, httpOnly: true});
}



