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

  static FORBIDDEN_PATTERNS =[
    /ADHD|주의력결핍/gi,
    /과잉행동|불안장애/gi,
    /우울증|자폐스펙트럼/gi,
    // "진단" 단독 → 문맥 포함으로 좁힘
    /장애가\s*있습니다|확정\s*진단|분명히\s*진단/gi,
    /치료가\s*반드시\s*필요|약물\s*치료|처방전/gi,
  ];

  static ANXIETY_REPLACEMENTS ={
    '위험합니다':   '주의가 필요합니다',
    '심각합니다':   '높은 편입니다',
    '비정상':       '특별한',
    // '이상' 제거 ← 핵심 수정
    '반드시 치료':  '전문가 확인',
    '당장 병원':    '가까운 시일 내 전문가',
  };

  static REQUIRED_DISCLAIMER =['상담사','참고','AI'];

  static check(rawText =''){
    let safeText =String(rawText);

    // null/undefined 방어
    if (!safeText || safeText ==='undefined'){
      return {blocked:false,text:'',corrected:true };
    }

    // 1단계: 금지 패턴 — lastIndex 초기화 필수
    for (const pattern of this.FORBIDDEN_PATTERNS){
      pattern.lastIndex =0;
      if (pattern.test(safeText)){
        console.warn(`🚫 BoundaryFilter BLOCKED: ${pattern.source}`);
        return {
          blocked:true,
          reason:`임상 금지어: ${pattern.source}`,
          text:null,
        };
      }
    }

    // 2단계: 불안 표현 완화
    Object.entries(this.ANXIETY_REPLACEMENTS).forEach(([bad, good])=>{
      const escaped = bad.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      safeText = safeText.replace(new RegExp(escaped,'gi'), good);
    });

    // 3단계: 면책 문구
    const needsDisclaimer =!this.REQUIRED_DISCLAIMER
      .every(kw => safeText.includes(kw));

    if (needsDisclaimer){
      safeText +=
        `\n\n⚠️ **AI 참고 정보**: `+
        `정확한 해석은 전문 상담사와 함께 확인하세요.`;
    }

    return {blocked:false,text: safeText,corrected: needsDisclaimer };
  }

  static test(){
    const cases =[
      "이 아이는 ADHD 증상이 보입니다.",     // → blocked
      "T점수 60 이상은 주목 필요합니다.",     // → 통과 (이상 치환 없음)
      "주의집중 문제가 심각합니다.",           // → 완화
      "상담사와 AI 참고 정보를 확인하세요.",   // → 통과
    ];
    cases.forEach((text, i)=>
      console.log(`Test ${i +1}:`,this.check(text))
    );
  }
}
