// server/src/routes/explain

import express from "express";
import {AIProvider }from "../ai/AIProvider.js";
import {BoundaryFilter }       from "../guardrails/BoundaryFilter.js";
import {SemanticAugmentation }from "../layers/SemanticAugmentation.js";

const router  = express.Router();
const ai      =new AIProvider();

router.post("/",async (req, res)=>{
  try {
    const { cbcData }= req.body;

    if (!cbcData?.scales ||!cbcData?.broadband){
      return res.status(400).json({
        error:"cbcData.scales와 cbcData.broadband가 필요합니다.",
      });
    }

    // Layer 3: Semantic Augmentation
    const augmented =SemanticAugmentation.augment(cbcData);

    const prompt =`아래 CBCL 검사 결과를 보호자가 이해할 수 있도록 설명해 주세요.
검사 결과: ${JSON.stringify(augmented,null,2)}`;

    // AI 호출 — 반환 타입 방어
    const aiResult =await ai.call(prompt);

    // string / object 모두 대응
    const rawText =
      typeof aiResult ==="string"
        ? aiResult
        : aiResult?.explanation ?? aiResult?.text ??JSON.stringify(aiResult);

    // Layer 5: BoundaryFilter
    const filtered =BoundaryFilter.check(rawText);

    if (filtered.blocked){
      console.error("🚫 BoundaryFilter blocked:", filtered.reason);
      return res.status(422).json({
        error:"안전 필터 위반",
        reason: filtered.reason,
      });
    }

    res.json({
      explanation: filtered.text,
      corrected:   filtered.corrected,
    });

  }catch (e){
    console.error("explain error:", e);
    res.status(500).json({error: e.message });
  }
});

export default router;