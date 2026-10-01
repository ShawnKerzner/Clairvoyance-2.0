import type { Request, Response, NextFunction } from "express";
import { pool } from "./db.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.session;
    if (!token) {
        res.status(401).json({ Error: "Unauthenticated request" });
        return;
    }
    const sessionResult = await pool.query("SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()", [token]);
    if (sessionResult.rows.length === 0) {
        res.status(401).json({ Error: "Unauthenticated request" });
        return
    }
    res.locals.userId = sessionResult.rows[0].user_id;
    next();
}