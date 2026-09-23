# 배포 순서: GitHub + Neon + Vercel

## 1. Neon PostgreSQL 만들기

1. Neon에서 새 PostgreSQL 프로젝트를 만든다.
2. Connection string을 복사한다.
3. 로컬 프로젝트 루트에 `.env.local`을 만들고 다음처럼 넣는다.

```bash
DATABASE_URL=postgresql://...
```

실제 URL은 Git에 커밋하지 않는다.

## 2. 의존성 설치와 DB 마이그레이션

```bash
npm install
npm run db:push
npm run test
npm run build
```

## 3. GitHub 공개 저장소에 올리기

```bash
git init
git add .
git commit -m "build ALEPH T04 bitcoin board"
git branch -M main
git remote add origin <YOUR_PUBLIC_GITHUB_REPOSITORY_URL>
git push -u origin main
```

저장소는 심사자가 로그인하지 않아도 볼 수 있도록 **Public**이어야 한다.

## 4. Vercel 배포

1. Vercel에서 GitHub 저장소를 Import한다.
2. Environment Variables에 `DATABASE_URL`을 추가한다.
3. Deploy한다.
4. 생성된 `https://...vercel.app` URL을 새 시크릿 창에서 연다.

## 5. 실제 날짜 증거 2건 만들기

앱의 `실제 데이터` 탭에서 `최신 가격 조회`를 누른다.

- 첫 번째 실제 Asia/Seoul 날짜에 한 번 이상 조회
- 다음 실제 Asia/Seoul 날짜에 다시 한 번 이상 조회

같은 날짜에 여러 번 눌러도 일별 DB 행은 하나로 UPSERT되고, 실제 날짜 증거도 같은 날짜 한 건만 갱신된다.
두 번째 실제 날짜까지 확보되면 화면에 `2 / 2`가 표시되는지 확인한다.

## 6. 제출용 소스 URL 만들기

마지막 수정까지 끝낸 뒤 GitHub의 전체 commit SHA(40자리)를 확인한다.

```bash
git rev-parse HEAD
```

제출 소스 URL은 브랜치 URL 대신 아래처럼 **commit SHA가 들어간 고정 URL**을 사용한다.

```text
https://github.com/<USER>/<REPO>/tree/<40자리-소문자-commit-sha>
```

## 7. 마지막 시크릿 창 점검

결과 URL과 소스 URL을 모두 새 시크릿 창에서 열어 다음이 없는지 확인한다.

- 계정 생성
- 로그인
- 인증
- 초대
- 비밀번호
- OAuth
- CAPTCHA
