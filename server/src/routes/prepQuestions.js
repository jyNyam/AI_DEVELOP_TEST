// server/src/routes/preQuestions.js


import express from "express";
import { AIProvider } from "../ai/AIProvider.js";
import { BoundaryFilter } from "../guardrails/BoundaryFilter.js";

const router = express.Router();
const ai = new AIProvider();

router.post("/", async (req, res) => {
  const { cbcData } = req.body;

  const prompt = `상담 시 물어볼 질문을 만들어 주세요.
검사 결과: ${JSON.stringify(cbcData, null, 2)}`;

  const raw = await ai.call(prompt);
  const filtered = BoundaryFilter.check(raw);

  res.json({ questions: filtered.text });
});

export default router;