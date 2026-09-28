import express from "express";
const app = express();

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok"})
});

app.listen(3000, () => {
    console.log("server is listening on port 3000...")
})