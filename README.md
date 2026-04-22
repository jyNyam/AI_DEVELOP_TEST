# 🧒 Amamtte CBCL AI POC Server

CBCL(아동 행동 체크리스트) 보고서를 분석하여 보호자가 이해하기 쉬운 언어로 변환하고, 상담 준비를 돕는 AI 백엔드 엔진입니다.

## 🏗 System Architecture

본 서버는 **Layered Pipeline** 구조를 채택하여 데이터의 정확성과 설명의 따뜻함을 동시에 확보합니다.
PDF → [1. Extraction] → [2. Normalization] → [3. Validation] → [4. Narrative] → [5. Action]
LLM Vision T-Score 표준화 Zod 검증 AI 설명 생성 홈케어 추천



1. **Extraction Layer**: LLM Vision으로 PDF에서 raw 데이터 추출
2. **Normalization Layer**: T-Score 재분류 + semantic mapping
3. **Validation Layer**: Zod 스키마로 런타임 검증
4. **Narrative Layer**: AI가 강점/비유 중심 설명 생성
5. **Action Layer**: DB 기반 홈케어 가이드 매칭

## 🚀 Quick Start

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 입력합니다.

```env
AI_PROVIDER=anthropic
ANTHROPIC_KEY=YOUR_REAL_KEY

# 텍스트 생성용 (실제 구동되는 현재의 Haiku 모델)
ANTHROPIC_MODEL=claude-haiku-4-5-20251001

# PDF 파싱 / Vision 용 (실제 구동되는 현재의 Sonnet 모델)
ANTHROPIC_VISION_MODEL=claude-sonnet-4-6
OPENAI_MODEL=gpt-4o
PORT=4000
```

### 2. 설치 및 실행

```bash
npm install
npm run dev
```

서버 실행: `http://localhost:4000`

## 📡 API

### `POST /api/extract`
PDF → 구조화 CBCL JSON

```bash
curl -X POST http://localhost:4000/api/extract \
  -F "file=@sample.pdf" > extract_result.json
```

### `POST /api/explain`
CBCL JSON → 보호자 설명 + 홈케어

```bash
curl -X POST http://localhost:4000/api/explain \
  -H "Content-Type: application/json" \
  -d @extract_result.json
```

## 🤖 사용 모델

| 단계 | 모델 | 선택 이유 |
|------|------|----------|
| **PDF 파싱 (Vision)** | Claude Sonnet 4.6 | 복잡한 테이블/레이아웃 인식 최우수 |
| **설명 생성** | Claude Haiku 4.5 | 비용 효율성 + 빠른 응답 |

**Fallback**: OpenAI GPT-4o-mini

## 💰 예상 운영 비용

| 월 처리량 | Haiku 기준 | GPT-4o-mini 기준 |
|-----------|------------|------------------|
| **1,000건** | ₩4,000 ~ ₩11,000 | ₩3,000 ~ ₩7,000 |
| **10,000건** | ₩40,000 ~ ₩110,000 | ₩30,000 ~ ₩70,000 |

*Prompt Caching 적용 시 90% 비용 절감 가능

## 🛡️ 안전장치 (Guardrails)
✅ Zod 스키마 검증 (런타임 타입 안전성)
✅ Semantic Normalization (경계선→준임상 표준화)
✅ BoundaryFilter (진단/처방 언급 금지)
✅ Fallback Narrative (AI 오류 시 안전 응답)
✅ 개인정보 마스킹 권장



## 🔒 보안 주의사항
✅ .env → .gitignore 필수
✅ API 키 노출 시 즉시 재발급
✅ 개인정보 업로드 전 마스킹 권장
✅ 로컬 개발 전용, 운영 시 Secret Manager 권장



## 📋 E2E 테스트 (End-to-End Pipeline)
터미널 1 (서버):
npm run dev

터미널 2 (테스트):

# 1. PDF → CBCL JSON
curl -X POST http://localhost:4000/api/extract -F "file=@sample.pdf" -o extract_result.json

# 2. CBCL JSON → 보호자 설명
curl -X POST http://localhost:4000/api/explain -H "Content-Type: application/json" -d @extract_result.json


## ⚠️ 중요 안내

**본 도구는 보호자 이해 보조용이며, 임상 진단/치료를 대체하지 않습니다.**

---
**Amamtte AI POC Server v1.0**  
**2026.04.23**