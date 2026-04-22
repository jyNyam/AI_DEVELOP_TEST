// server/src/routes/explain.js

import express from "express";
import { AIProvider } from "../ai/AIProvider.js";
import { SYSTEM_PROMPT } from "../ai/systemPrompt.js";

const router = express.Router();
const ai = new AIProvider();

const ANALOGY_DB = {
  "주의집중 문제": {
    비유: "여러 자극에 동시에 반응하는 안테나가 예민한 상태예요.",
    강점: "호기심이 많고 다양한 것에 관심을 갖는 아이일 수 있어요.",
  },
  "우울/불안": {
    비유: "새로운 상황에 더 신중하게 반응하는 편일 수 있어요.",
    강점: "감수성이 풍부하고 타인 감정을 잘 알아차릴 수 있어요.",
  },
  "위축": {
    비유: "조용히 상황을 먼저 살피는 관찰형 기질에 가까워요.",
    강점: "신중하고 깊이 생각하는 성향일 수 있어요.",
  },
  "사회적 미성숙": {
    비유: "자기만의 속도로 자라는 아이예요.",
    강점: "자기 관심사에 깊이 몰입하는 힘이 있을 수 있어요.",
  },
};

const HOMECARE_DB = {
  "주의집중 문제": {
    오늘당장: [
      "숙제나 놀이를 짧은 단위로 나누고, 끝날 때마다 짧게 칭찬해 주세요.",
      "25분 집중 후 5분 쉬는 식으로 리듬을 함께 맞춰 보세요.",
    ],
    상담질문: [
      "집에서 집중이 잘 되는 조건은 어떤 환경인가요?",
      "학교와 가정에서 같은 방식으로 도울 수 있는 방법이 있을까요?",
    ],
  },
  "우울/불안": {
    오늘당장: [
      "잠들기 전 오늘 괜찮았던 일 한 가지를 함께 이야기해 보세요.",
      "불안해 보일 때 바로 해결보다 먼저 공감 표현을 해 주세요.",
    ],
    상담질문: [
      "어떤 상황에서 긴장이나 걱정이 더 커지는 편인가요?",
      "가정에서 안정감을 높이는 일상 루틴이 있을까요?",
    ],
  },
  "위축": {
    오늘당장: [
      "말을 많이 시키기보다 아이가 편한 속도로 반응할 시간을 주세요.",
      "1:1 활동으로 부담 없는 상호작용 시간을 만들어 보세요.",
    ],
    상담질문: [
      "낯선 상황에서 조심스러운 기질인지, 지속적 어려움인지 어떻게 구분하나요?",
    ],
  },
  "사회적 미성숙": {
    오늘당장: [
      "또래 비교 표현을 줄이고 아이의 현재 속도를 존중해 주세요.",
      "관심 있는 놀이를 매개로 자연스러운 상호작용을 늘려 보세요.",
    ],
    상담질문: [
      "발달 속도 차이를 가정에서 어떤 방식으로 지지하면 좋을까요?",
    ],
  },
};

function buildHomecareGuide(flaggedScales) {
  const today = [];
  const questions = [];

  for (const scale of flaggedScales) {
    const guide = HOMECARE_DB[scale];
    if (!guide) continue;
    today.push(...guide.오늘당장);
    questions.push(...guide.상담질문);
  }

  return {
    오늘당장: [...new Set(today)].slice(0, 3),
    상담질문: [...new Set(questions)].slice(0, 3),
  };
}

function buildAnalogyContext(flaggedScales) {
  return flaggedScales
    .map((name) => {
      const item = ANALOGY_DB[name];
      if (!item) return null;
      return `${name}: ${item.비유} / 강점: ${item.강점}`;
    })
    .filter(Boolean)
    .join("\n");
}

function buildFallbackNarrative(flaggedScales) {
  if (!flaggedScales.length) {
    return {
      summary: "전반적으로 안정적인 모습이 관찰되며, 현재 강점을 잘 지켜보는 것이 중요해 보여요.",
      strength: "아이의 일상 적응과 행동 측면에서 비교적 안정적인 부분이 확인돼요.",
      areas: [],
      disclaimer:
        "이 내용은 AI가 정리한 참고용 설명이며, 정확한 해석은 상담사와 함께 확인해 주세요.",
    };
  }

  return {
    summary: "전반적인 생활은 유지되고 있으며, 몇몇 영역은 조금 더 세심한 관찰이 도움이 될 수 있어요.",
    strength: "아이의 강점과 기질을 함께 이해하면서 접근하는 것이 중요해 보여요.",
    areas: flaggedScales.map((name) => ({
      name,
      explanation:
        "이 영역은 일상에서 아이가 조금 더 민감하게 반응할 수 있는 부분으로 이해해 볼 수 있어요.",
      analogy: ANALOGY_DB[name]?.비유 || "",
    })),
    disclaimer:
      "이 내용은 AI가 정리한 참고용 설명이며, 정확한 해석은 상담사와 함께 확인해 주세요.",
  };
}

router.post("/", async (req, res) => {
  try {
    const { scales, broadband, childAge, childGender } = req.body;

    if (!scales || !broadband) {
      return res.status(400).json({
        error: "scales와 broadband 데이터가 필요합니다.",
      });
    }

    const flaggedScales = Object.entries(scales)
      .filter(([, v]) => ["준임상", "임상"].includes(v?.range))
      .map(([k]) => k);

    const analogyContext = buildAnalogyContext(flaggedScales);
    const homecare = buildHomecareGuide(flaggedScales);

    const userPrompt = `아동 정보: ${childAge ?? "미상"}세 ${childGender ?? "미상"}아

종합 상태:
- 내재화: T=${broadband?.internalizing?.tScore ?? "미상"} (${broadband?.internalizing?.range ?? "미상"})
- 외현화: T=${broadband?.externalizing?.tScore ?? "미상"} (${broadband?.externalizing?.range ?? "미상"})
- 전체: T=${broadband?.total?.tScore ?? "미상"} (${broadband?.total?.range ?? "미상"})

주목할 영역:
${flaggedScales.length ? flaggedScales.join(", ") : "없음"}

참고 비유:
${analogyContext || "없음"}

다음 규칙을 지켜 JSON 형식으로만 작성하세요:
{
  "summary": "전체 상태 한 줄 요약",
  "strength": "아이가 잘하고 있는 부분 1-2문장",
  "areas": [
    {
      "name": "영역명",
      "explanation": "보호자 친화적 설명 2-3문장",
      "analogy": "비유 1문장"
    }
  ],
  "disclaimer": "이 내용은 AI가 요약한 참고 정보입니다. 정확한 해석은 반드시 전문 상담사와 함께 확인해 주세요."
}`;

    const rawText = await ai.callText(userPrompt, SYSTEM_PROMPT);

    let cleaned = rawText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/i, "");

    let narrative;
    try {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("No JSON found");
      narrative = JSON.parse(match[0]);
    } catch {
      narrative = buildFallbackNarrative(flaggedScales);
    }

    res.json({
      success: true,
      narrative,
      homecare,
    });
  } catch (err) {
    console.error("explain error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;