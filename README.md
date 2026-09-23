# 오늘의 비트코인 — ALEPH T04

Coinbase Exchange의 공개 BTC/USD 최근 체결가를 가져와 `Asia/Seoul` 날짜 기준으로 저장하고, 전일 대비를 계산하며, 외부 데이터 실패 시 마지막 정상값을 보존하는 정보판입니다.

이 프로젝트는 제공된 T04 공개 계약의 **실제 LIVE 데이터 경로**와 **합성 replay 경로**를 분리하되, 정규화/검증/비교 규칙을 명시적으로 코드에 남기는 방향으로 구성했습니다.

## 사용 스택

- Next.js + TypeScript
- Neon PostgreSQL
- Drizzle ORM
- Vercel
- GitHub
- Vitest

## 데이터 흐름

```text
Coinbase BTC/USD trades
        ↓
fetchLatestCoinbaseTrade()
        ↓
normalizeCoinbaseTrade()
        ↓
validateNormalizedReading()
        ↓
PostgreSQL UPSERT
        ↓
전일 비교 comparisonFor()
        ↓
실제 데이터 화면
```

합성 실패 재생은 다음 흐름을 사용합니다.

```text
assignment/fixtures/*.json
        ↓
runFixture()
        ↓
applySuccessfulReading() / applyError()
        ↓
replay_states JSONB
        ↓
합성 장애 재생 화면
```

`Reset`은 `replay_states`만 초기화하며 실제 Coinbase 기록은 지우지 않습니다.

## 핵심 구현 위치

```text
src/lib/live/coinbase.ts       Coinbase 공개 API 호출 / HTTP 오류 분류
src/lib/live/normalize.ts      Coinbase → normalized reading 변환
src/lib/shared/validation.ts   공개 계약에 맞춘 normalized reading 검증
src/lib/shared/comparison.ts   저장된 두 날짜의 전일 대비 계산
src/lib/db/schema.ts           PostgreSQL 테이블 / UNIQUE 제약
src/lib/db/repository.ts       same-day UPSERT, live 증거 2건, replay persistence
src/lib/replay/engine.ts       9개 fixture 상태 전이
src/components/BitcoinBoard.tsx 실제/합성 검증 화면
```

## DB 규칙

`daily_readings`에는 `(signal_id, record_date)` UNIQUE 제약이 있습니다.
따라서 같은 서울 날짜의 성공 조회는 `ON CONFLICT DO UPDATE` 의미로 같은 행을 갱신하고, 다음 서울 날짜는 새 행이 됩니다.

`live_receipts`는 C22 검증을 쉽게 하기 위해 서로 다른 실제 `Asia/Seoul` 날짜를 최대 두 건 보존합니다. 같은 날짜에 다시 조회하면 그 날짜의 receipt 값을 최신 일별 값에 맞춰 갱신합니다.

`replay_states`는 합성 fixture 전용 상태입니다. 실제 기록과 섞이지 않습니다.

## 로컬 실행

1. Neon PostgreSQL 프로젝트를 만들고 `.env.local`에 연결 문자열을 넣습니다.

```bash
cp .env.example .env.local
```

2. 의존성을 설치하고 DB를 구성합니다.

```bash
npm install
npm run db:push
```

3. 테스트와 개발 서버를 실행합니다.

```bash
npm run test
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

4. 사용자는 Vercel에서 배포한 URL을 실행하여 검증해봅니다.

## fixture 기본 검증 순서

정상 UPSERT/다음 날짜:

```text
Reset → T04-NORMAL-D1-A → T04-NORMAL-D1-B → T04-NORMAL-D2
```

실패 보존:

```text
Reset → T04-NORMAL-D1-A → T04-NORMAL-D1-B → 각 실패 fixture
```

회복:

```text
Reset → T04-NORMAL-D1-A → T04-NORMAL-D1-B → T04-TIMEOUT → T04-RECOVER-D2
```

마지막 시퀀스의 기대 결과는 `fresh / none`, 일별 행 2개, 현재값 120, 전일 대비 15입니다.

## 실제 날짜 증거

fixture의 D1/D2는 실제 날짜 증거가 아닙니다. 
배포 후 서로 다른 실제 `Asia/Seoul` 날짜에 `최신 가격 조회`를 실행해 화면의 `실제 날짜 증거`가 `2 / 2`가 되도록 코딩하였습니다.

## 배포/제출

- 배포: `docs/DEPLOYMENT.md`
- 제출문: `docs/SUBMISSION_TEMPLATE.md`
- C01~C35 체크: `docs/CRITERIA_CHECKLIST.md`
- 사용자 기획 방향만 정리한 메모: `docs/USER_PLANNING_MEMO.md`

## 공개 과제 원본

과제 제출자가 제공한 README, contract, registry, schema, fixture는 `assignment/` 아래에 원본 형태로 보존했습니다.
