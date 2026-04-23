# 🧠 Amamtte CBCL AI POC Server v2.0

CBCL 검사 결과를 보호자 언어로 변환하고 상담 준비를 지원하는 AI 백엔드 엔진입니다.

## 🏗 5-Layer Pipeline

`PDF` → `[1. Extraction (Sonnet 4.6)]` → `[2. Normalization]` → `[3. Validation (Zod)]` → `[4. Narrative (Haiku 4.5)]` → `[5. Action]` → `JSON`

## 🚀 Quick Start

### 1. 서버 폴더에서 실행

```bash
cd server
```

### 2. 환경변수 설정

```env
AI_PROVIDER=anthropic
ANTHROPIC_KEY=sk-ant-your-key  
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
ANTHROPIC_VISION_MODEL=claude-sonnet-4-6
OPENAI_KEY=sk-proj-your-key
OPENAI_MODEL=gpt-4o-mini
PORT=4000
```

### 3. 서버 실행

```bash
npm install && npm run dev
# ✅ http://localhost:4000
```

## 📡 API (실제 테스트 완료)

### 1. `POST /api/extract`

```bash
cd ..  # 루트로 이동
curl -X POST http://localhost:4000/api/extract \
  -F "file=@sample.pdf" -o extract_result.json
```

### 2. `POST /api/explain` 

```bash
jq '{cbcData: .}' extract_result.json > explain_input.json
curl -X POST http://localhost:4000/api/explain \
  -H "Content-Type: application/json" -d @explain_input.json
```

### 3. `POST /api/prep-questions` (선택)

```bash
curl -X POST http://localhost:4000/api/prep-questions \
  -H "Content-Type: application/json" -d @explain_input.json
```

## 💰 월 1,000건 비용

| 시나리오 | 비용 | 특징 |
|----------|------|------|
| **권장** (Haiku+Sonnet) | $5~$15 | 최적 균형 |
| **PoC** (Haiku) | $3~$8 | 한국어 우수 |
| **최저** (GPT-4o-mini) | $2~$5 | 비용 우선 |

## ✅ E2E 테스트 (복사 실행)

```bash
# 터미널1: 서버
cd server && npm run dev

# 터미널2: 테스트  
cd .. && curl -X POST http://localhost:4000/api/extract -F "file=@sample.pdf" -o extract_result.json
jq '{cbcData: .}' extract_result.json > explain_input.json
curl -X POST http://localhost:4000/api/explain -H "Content-Type: application/json" -d @explain_input.json
```

## 🛡️ 안전장치

- ✅ **Zod 검증**: 데이터 무결성 보장
- ✅ **중립어 변환**: '경계선' → '준임상'  
- ✅ **진단 차단**: ADHD 등 단정 표현 필터링
- ✅ **면책 명시**: "임상 진단 대체 불가"

## 🔒 보안

- ✅ `.env` → `.gitignore` 필수
- ✅ 프로덕션: Secret Manager 권장
- ✅ PII 마스킹 권장

---

**⚠️ 보호자 이해 보조용 | 임상 진단 대체 불가**

**Amamtte AI POC Server v2.0 | 2026.04.23 | ✅ 검증완료**