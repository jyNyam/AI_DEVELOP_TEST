// server/src/index.js

import "dotenv/config"; // ⭐ 환경변수 최상단 로드
import express from "express";
import extractRoute from "./routes/extract.js";
import explainRoute from "./routes/explain.js";
import prepRoute from "./routes/prepQuestions.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({ 
    ok: true, 
    message: "amamtte-ai-poc-server", 
    apis: ["/api/extract", "/api/explain", "/api/prep-questions"]
  });
});

app.use("/api/extract", extractRoute);
app.use("/api/explain", explainRoute);
app.use("/api/prep-questions", prepRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});