// server/src/routes/extract.js

import express from "express";
import multer from "multer";
import { AIProvider } from "../ai/AIProvider.js";
import { CBCSchema } from "../schema/cbcSchema.js";
import { normalizeCBC } from "../utils/normalizeCBC.js";

const router = express.Router();
const upload = multer({
  limits: { fileSize: 20 * 1024 * 1024 },
});

const ai = new AIProvider();

router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "PDF 파일이 필요합니다." });
    }

    const extractPrompt = `CBCL 검사 결과지 PDF를 분석해서 데이터를 추출하세요.

반드시 아래 조건을 지키세요:
1. 출력은 오직 하나의 유효한 JSON 객체만 허용합니다.
2. 마크다운 코드블록(\`\`\`json)을 사용하지 마세요.
3. 설명 문장, 주석, 여분의 텍스트를 절대 추가하지 마세요.
4. 숫자는 숫자 타입으로 출력하세요.
5. 값이 없거나 확실하지 않으면 null을 사용하세요.
6. 아래 스키마와 정확히 같은 키 구조를 사용하세요.
7. range는 "정상", "준임상", "임상", null 중 하나만 사용하세요.
8. range가 "경계선", "준임상 범위", "borderline" 등으로 보이면 "준임상"으로 표준화하세요.

{
  "childName": "이름",
  "childAge": 0,
  "childGender": "성별",
  "examDate": "YYYY.MM.DD",
  "scales": {
    "위축": { "tScore": 0, "percentile": null, "range": null }
  },
  "broadband": {
    "internalizing": { "tScore": 0, "percentile": null, "range": null },
    "externalizing": { "tScore": 0, "percentile": null, "range": null },
    "total": { "tScore": 0, "percentile": null, "range": null }
  }
}`;

    const rawText = await ai.callWithVision(
      req.file.buffer,
      req.file.mimetype,
      extractPrompt
    );

    let extracted = rawText.trim();
    extracted = extracted.replace(/^```json\s*/i, "").replace(/```$/i, "");

    const match = extracted.match(/\{[\s\S]*\}/);
    if (!match) {
      return res.status(400).json({
        error: "JSON 블록을 찾지 못했습니다.",
        rawText,
      });
    }

    const parsedJson = JSON.parse(match[0]);
    const normalized = normalizeCBC(parsedJson);

    const result = CBCSchema.safeParse(normalized);
    if (!result.success) {
      return res.status(400).json({
        error: "CBC schema validation failed",
        details: result.error.flatten(),
        normalized,
      });
    }

    res.json(result.data);
  } catch (e) {
    console.error("extract error:", e);
    res.status(500).json({ error: e.message });
  }
});

export default router;