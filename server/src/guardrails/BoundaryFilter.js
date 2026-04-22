// server/src/guardrails/BoundaryFilter.js

/**
 * BoundaryFilter
 *
 * 목적:
 * 아동 발달·정신건강 도메인에서
 * LLM이 임상 영역(진단/처방/심각도 판단)을 침범하지 못하도록
 * 사후 2차 안전장치 역할 수행
 */

const FORBIDDEN_PATTERNS = [
  // 진단명
  /ADHD|주의력결핍|과잉행동장애|우울증|불안장애|자폐|아스퍼거|조현병|품행장애/gi,

  // 치료·처방
  /치료(가|를|이)\s*(필요|권장|요청)/gi,
  /약물\s*(복용|처방|치료)/gi,
  /병원(에|을|으로)\s*(가|방문|내원)/gi,

  // 심각도 단정
  /심각(하다|합니다|한\s*상태)/gi,
  /위험(하다|합니다|한\s*수준)/gi,
  /비정상(적|입니다|이에요)/gi,

  // 예후 예측
  /앞으로\s*(악화|호전|발전)될/gi,
  /치료하지\s*않으면/gi,
];

const SAFE_REPLACEMENT =
  "[이 부분은 전문 상담사와의 상담에서 자세히 안내받으실 수 있습니다.]";

export class BoundaryFilter {
  /**
   * @param {string} text - LLM 출력 원문
   * @returns {{ text: string, violated: boolean, matches: string[] }}
   */
  static check(text) {
    let result = text;
    const matches = [];

    for (const pattern of FORBIDDEN_PATTERNS) {
      const found = result.match(pattern);
      if (found) {
        matches.push(...found);
        result = result.replace(pattern, SAFE_REPLACEMENT);
      }
    }

    const violated = matches.length > 0;

    if (violated) {
      console.warn("🚨 [BOUNDARY VIOLATION DETECTED]", {
        time: new Date().toISOString(),
        matches,
      });
    }

    return { text: result, violated, matches };
  }
}