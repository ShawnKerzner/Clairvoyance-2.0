import express from "express";
const app = express();
import { pool } from "./db.js";



app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok"})
});

app.get('/api/db-test', async (req, res) => {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json(result.rows[0].now)
});

app.post('/api/auth/signup', (req, res) => {
    
})

app.listen(3000, () => {
    console.log("server is listening on port 3000...")
});

