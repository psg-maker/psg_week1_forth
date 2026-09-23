# T04 C01-C35 구현 체크리스트

| 조건 | 구현/확인 위치 | 배포 후 확인 |
|---|---|---|
| C01 | 공개 GitHub + Vercel 배포 가이드 | 시크릿 창에서 계정 생성 없음 |
| C02 | 공개 GitHub + Vercel 배포 가이드 | 시크릿 창에서 로그인 없음 |
| C03 | `src/lib/live/coinbase.ts` | Coinbase 실제 조회 성공 |
| C04 | 실제 데이터 메인 카드 | 값 표시 |
| C05 | 실제 데이터 메인 카드 | `USD/BTC` 표시 |
| C06 | 데이터 정보 | Coinbase Exchange 표시 |
| C07 | 데이터 정보 | 출처 시각 표시 |
| C08 | 데이터 정보 | 조회 시각 표시 |
| C09 | 데이터 정보 | Asia/Seoul 표시 |
| C10 | 원자료 ↔ 저장값 확인 카드 | raw price/time과 저장값 일치 |
| C11 | 공개 API는 키 없음, DB URL은 서버 환경변수 | Git/Network에서 DATABASE_URL 노출 0건 |
| C12 | `T04-TIMEOUT` 버튼/engine | stale/timeout |
| C13 | `T04-AUTH-401` 버튼/engine | stale/auth |
| C14 | `T04-RATE-429` 버튼/engine | stale/rate_limit |
| C15 | `T04-OFFLINE` 버튼/engine | stale/offline |
| C16 | `T04-SCHEMA-BREAK` 버튼/validation | stale/schema_error |
| C17 | `applyError()`가 current/daily rows를 수정하지 않음 | 값 105 유지 |
| C18 | stale badge + 오류 카드 | 오래된 데이터 표시 |
| C19 | stale 상태 Recover D2 재시도 버튼 | fresh/none, 2 rows, delta 15 |
| C20 | DB unique + `onConflictDoUpdate`, replay same-date update | D1-A → D1-B 후 1 row |
| C21 | 다음 날짜 record_date 신규 row | D2 후 2 rows |
| C22 | `live_receipts`가 서로 다른 실제 날짜 최대 2건 보존 | 실제 날짜 2개에서 조회 후 2/2 |
| C23 | receipt/일별 테이블/현재값 모두 같은 normalized data 사용 | 두 증거 값 비교 |
| C24 | `comparisonFor()` 저장값 기반 계산 | 두 날짜 delta 재계산 |
| C25 | 앱/제출문에 개인 기록 미사용 | 공개 화면 점검 |
| C26 | replay은 `assignment/fixtures`만 사용 | LIVE 데이터와 분리 확인 |
| C27 | `docs/SUBMISSION_TEMPLATE.md` | 3단계 확인법 제출 |
| C28 | `docs/SUBMISSION_TEMPLATE.md` | AI/학생/거절 항목 제출 |
| C29 | 공개 배포 | 인증 없음 |
| C30 | 공개 배포 | 초대 없음 |
| C31 | 공개 배포 | 비밀번호 없음 |
| C32 | 공개 배포 | OAuth 없음 |
| C33 | 공개 배포 | CAPTCHA 없음 |
| C34 | Vercel HTTPS URL 한 개 | 제출 필드 확인 |
| C35 | GitHub `/tree/<40hex>` URL 한 개 | commit SHA 고정 URL 확인 |
