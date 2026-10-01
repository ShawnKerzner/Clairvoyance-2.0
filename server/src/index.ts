import express from "express";
import { pool } from "./db.js";
import bcrypt from "bcryptjs";
import { createSession } from "./sessions.js";
import cookieParser from "cookie-parser";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok"})
});

app.get('/api/db-test', async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json(result.rows[0].now)
});

app.post('/api/auth/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username|| !password) {
        res.status(400).json({Error: "Username or password is empty."})
    } else if (username.length > 15) {
        res.status(400).json({Error: "Username must be 15 characters or less."})
    } else {
        const result = await pool.query("SELECT username FROM users WHERE username = $1", [username]);
        if(result.rows.length === 1) {
            res.status(409).json({ Error: "Username already taken." })
        } else {
            const passwordHash = await bcrypt.hash(password, 10);
            const insertResult = await pool.query("INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username", [username, passwordHash]);
            await createSession(insertResult.rows[0].id, res);
            res.status(201).json(insertResult.rows[0]);
        }   
    }
});

app.post('/api/auth/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        res.status(400).json({ Error: "Username or password is empty"});
    } else {
        const userResult = await pool.query("SELECT id, username, password_hash FROM users WHERE username = $1", [username]);
        if (userResult.rows.length === 0) {
            res.status(401).json({Error: "Username or password is incorrect."});
        } else {
            const passwordMatch = await bcrypt.compare(password,userResult.rows[0].password_hash);
            if (!passwordMatch) {
                 res.status(401).json({Error: "Username or password is incorrect."});
            } else {
                await createSession(userResult.rows[0].id, res);
                res.status(200).json({id: userResult.rows[0].id, username: username});
            }
        }
    }
});

app.post('/api/auth/logout', async (req, res) => {

});

app.listen(3000, () => {
    console.log("server is listening on port 3000...")
});

