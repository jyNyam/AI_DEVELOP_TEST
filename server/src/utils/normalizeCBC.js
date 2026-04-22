// server/src/utils/normalizeCBC.js

import { classifyRange } from "./classify.js";

const SEMANTIC_MAP = {
  "경계선": {
    standard: "준임상",
    meaning: "위험 신호",
    clinicalNote: "추적 관찰 필요",
  },
  "borderline": {
    standard: "준임상",
    meaning: "위험 신호",
    clinicalNote: "추적 관찰 필요",
  },
  "준임상": {
    standard: "준임상",
    meaning: "위험 신호",
    clinicalNote: "추적 관찰 필요",
  },
  "준 임상": {
    standard: "준임상",
    meaning: "위험 신호",
    clinicalNote: "추적 관찰 필요",
  },
  "준임상범위": {
    standard: "준임상",
    meaning: "위험 신호",
    clinicalNote: "추적 관찰 필요",
  },
  "정상": {
    standard: "정상",
    meaning: "일반 범위",
    clinicalNote: "정기 관찰",
  },
  "정상범위": {
    standard: "정상",
    meaning: "일반 범위",
    clinicalNote: "정기 관찰",
  },
  "임상": {
    standard: "임상",
    meaning: "높은 주의 필요",
    clinicalNote: "전문가 해석 권장",
  },
  "임상범위": {
    standard: "임상",
    meaning: "높은 주의 필요",
    clinicalNote: "전문가 해석 권장",
  },
};

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

function normalizeRangeValue(value) {
  if (value == null || value === "") return null;

  const v = String(value).trim();
  const lower = v.toLowerCase();

  if (SEMANTIC_MAP[v]) {
    return SEMANTIC_MAP[v].standard;
  }

  if (SEMANTIC_MAP[lower]) {
    return SEMANTIC_MAP[lower].standard;
  }

  return v;
}

function buildSemantic(rawRange, finalRange) {
  if (finalRange && SEMANTIC_MAP[finalRange]) {
    return {
      rawRange,
      standardRange: SEMANTIC_MAP[finalRange].standard,
      meaning: SEMANTIC_MAP[finalRange].meaning,
      clinicalNote: SEMANTIC_MAP[finalRange].clinicalNote,
    };
  }

  return {
    rawRange,
    standardRange: finalRange,
    meaning: null,
    clinicalNote: null,
  };
}

function normalizeScaleItem(item, isComposite = false) {
  if (!item || typeof item !== "object") {
    return {
      tScore: null,
      percentile: null,
      range: null,
      semantic: buildSemantic(null, null),
    };
  }

  const tScore = num(item.tScore);
  const percentile = num(item.percentile);
  const rawRange = item.range ?? null;

  const mappedRange = normalizeRangeValue(rawRange);
  const classifiedRange = classifyRange(tScore, isComposite);

  const finalRange = classifiedRange || mappedRange || null;

  return {
    ...item,
    tScore,
    percentile,
    range: finalRange,
    semantic: buildSemantic(rawRange, finalRange),
  };
}

export function normalizeCBC(parsed) {
  const safe = {
    childName: parsed?.childName ?? null,
    childAge: num(parsed?.childAge),
    childGender: parsed?.childGender ?? null,
    examDate: parsed?.examDate ?? null,
    scales: {},
    broadband: {},
  };

  const scales = parsed?.scales ?? {};
  for (const k of Object.keys(scales)) {
    safe.scales[k] = normalizeScaleItem(scales[k], false);
  }

  const broadband = parsed?.broadband ?? {};
  for (const k of ["internalizing", "externalizing", "total"]) {
    safe.broadband[k] = normalizeScaleItem(broadband[k], true);
  }

  return safe;
}