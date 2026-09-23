# 제출문 초안

## 결과물 URL

`https://<YOUR-VERCEL-DOMAIN>`

## 소스 URL

`https://github.com/<USER>/<REPO>/tree/<40자리-소문자-commit-sha>`

## 짧은 확인 방법

1. 결과물 URL의 **실제 데이터** 탭에서 `최신 가격 조회`를 눌러 값·단위·출처·출처 시각·조회 시각·Asia/Seoul이 보이는지 확인합니다.
2. **합성 장애 재생** 탭에서 `Reset → 정상 D1-A → 정상 D1-B → Timeout`을 실행합니다. 값 105가 유지된 채 `stale / timeout`과 재시도 버튼이 보이면 통과입니다.
3. `Recover D2`를 실행합니다. `fresh / none`, 일별 행 2개, 전일 대비 15가 보이면 통과입니다. 실패 시에는 마지막 정상값이 유지된 채 오류별 메시지가 표시됩니다.

## AI 사용 구분

### ① AI에게 맡긴 일

- 과제 공개 계약과 fixture를 기준으로 프로젝트 구조 초안 작성
- Next.js/TypeScript/Neon/Drizzle 기반 코드 구현 보조
- 합성 replay 상태 전이와 테스트 코드 작성 보조
- 가이드라인 누락 여부를 점검하기 위한 체크리스트 작성 보조

### ② 학생이 직접 판단한 일

- 달러 환율 대신 비트코인을 주제로 선택
- 빠른 구현보다 손이 더 가더라도 완성도를 높이는 방향 선택
- B안(Next.js + TypeScript + Neon PostgreSQL + Drizzle ORM + Vercel + GitHub) 선택
- 완성 후 기초 수준에서 코드와 에러 흐름을 다시 따라갈 수 있는 구조를 우선한다는 학습 방향 결정

### ③ AI 제안을 따르지 않은 일

- AI가 학습 목적에 맞춰 Vanilla HTML/CSS/JS + Express + 직접 SQL 방식도 제안했지만, 최종적으로는 B안 스택을 선택했습니다.
