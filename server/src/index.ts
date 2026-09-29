import express from "express";
const app = express();
import { pool } from "./db.js";
app.use(express.json());



app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok"})
});

app.get('/api/db-test', async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json(result.rows[0].now)
});

app.post('/api/auth/signup', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (!username|| !password) {
        res.status(400).json({Error: "Username or Password is empty."})
    } else if (username.length > 15) {
        res.status(400).json({Error: "Username must be 15 characters or less."})
    } else {
        res.status(201).json({Success: `Welcome ${username}!`})
    }
})

app.listen(3000, () => {
    console.log("server is listening on port 3000...")
});

