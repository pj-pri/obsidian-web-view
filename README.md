# Obsidian Web Vault

브라우저에서 동작하는 개인용 마크다운 노트 뷰어·에디터입니다.
Obsidian 스타일의 UI로 로컬 `.md` 파일을 읽고 편집할 수 있습니다.

---

## 빠른 시작

### 1. 서버 실행

**샘플 vault로 바로 실행 (파일 불필요)**
```bash
node server.js
```
브라우저에서 `http://localhost:5173` 열기

**내 vault 폴더 연결**
```bash
OBSIDIAN_VAULT_DIR=/path/to/vault node server.js
```

### 2. .env 파일로 설정 (권장)

```bash
cp .env.example .env
```

`.env` 파일 편집:
```
OBSIDIAN_VAULT_DIR=/Users/yourname/Documents/MyVault
PORT=5173
APP_LOGIN_USER=
APP_LOGIN_PASSWORD=
SESSION_SECRET=
```

이후 `node server.js`만 실행하면 자동으로 적용됩니다.

### 3. 인증 걸기 (선택)

앱 내부 로그인/로그아웃을 쓰려면:

```bash
APP_LOGIN_USER=admin \
APP_LOGIN_PASSWORD='change-me' \
SESSION_SECRET='replace-with-a-long-random-secret' \
node server.js
```

또는 `.env`에 추가:

```
APP_LOGIN_USER=admin
APP_LOGIN_PASSWORD=change-me
SESSION_SECRET=replace-with-a-long-random-secret
SESSION_TTL_MS=604800000
```

세션 로그인은 로그인 화면 + 로그아웃 버튼을 제공합니다.

레거시 Basic Auth로 브라우저 접근과 REST API를 보호하려면:

```bash
BASIC_AUTH_USER=admin \
BASIC_AUTH_PASSWORD='change-me' \
node server.js
```

또는 `.env`에 추가:

```
BASIC_AUTH_USER=admin
BASIC_AUTH_PASSWORD=change-me
BASIC_AUTH_REALM=Obsidian Web Vault
```

`BASIC_AUTH_USER`와 `BASIC_AUTH_PASSWORD`가 **둘 다 설정된 경우에만** 인증이 활성화됩니다.
세션 로그인(`APP_LOGIN_*`, `SESSION_SECRET`)이 켜져 있으면 Basic Auth는 무시됩니다.

### 4. 요청 제한 / 보안 헤더 (선택)

기본값:

```env
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=300
AUTH_RATE_LIMIT_WINDOW_MS=600000
AUTH_RATE_LIMIT_MAX_FAILURES=10
SECURITY_HEADERS_ENABLED=true
```

- 일반 요청: IP당 60초에 300회
- 인증 실패: IP당 10분에 10회
- `SECURITY_HEADERS_ENABLED=true`면 기본 보안 헤더와 CSP를 응답에 추가

---

## 모드 구분

| 모드 | 조건 | 기능 |
|------|------|------|
| **server** | `OBSIDIAN_VAULT_DIR` 설정됨 | 읽기·쓰기·삭제·검색 전체 |
| **local** | 이전 localStorage 세션 존재 | 브라우저 내 저장만 |
| **sample** | 그 외 | 내장 샘플 파일, 읽기 전용 |

현재 모드는 화면 우하단 상태바에 표시됩니다.

---

## 주요 기능

### 파일 관리 (server 모드)
- **새 노트**: 사이드바 `+` 버튼 또는 폴더 우클릭 → `New note here`
- **이름 변경**: 파일 우클릭 → `Rename` (참조 wikilink 자동 업데이트)
- **삭제**: 파일 우클릭 → `Delete` (`.trash/` 폴더로 이동, 복구 가능)
- **자동 저장**: 편집 후 1.5초 뒤 자동 저장, 상태바에 저장 상태 표시

### 뷰어
- **split / source / preview** 뷰 전환 (탭 우측 버튼)
- `[[wikilink]]` 클릭으로 노트 이동
- 백링크·아웃고잉 링크·**목차(TOC)**·그래프 뷰·태그 (우측 패널)
- **Frontmatter** YAML 파싱 및 표시
- 코드 블록 **언어별 구문 강조** (highlight.js), 테이블, 체크박스 토글
- 취소선 `~~text~~`, 하이라이트 `==text==` 렌더링

### 검색
- 사이드바 검색창에 입력 → 파일명·본문 검색 (server 모드에서는 본문 컨텍스트 포함)
- `#tag` 검색으로 태그 필터링

### 에디터
- 툴바 버튼으로 H1/H2/H3, 굵게, 기울임, 링크 등 삽입
- `/` 입력으로 슬래시 커맨드 메뉴
- `Cmd/Ctrl+B` 굵게, `Cmd/Ctrl+I` 기울임, `Cmd/Ctrl+K` 링크
- 이미지 붙여넣기 (Ctrl+V) → 서버 자동 업로드 후 마크다운 삽입

### 단축키

| 단축키 | 동작 |
|--------|------|
| `Cmd/Ctrl + P` | 파일 빠른 검색 (Command Palette) |
| `?` | 단축키 모음 보기 |
| `Cmd/Ctrl + B` | 굵게 |
| `Cmd/Ctrl + I` | 기울임 |
| `Cmd/Ctrl + K` | 링크 삽입 |
| `/` | 스니펫 삽입 메뉴 |
| `Esc` | 메뉴 닫기 |

---

## API 엔드포인트

서버가 실행 중일 때 사용할 수 있는 REST API입니다.

```
GET    /api/vault/files              파일 목록 (메타데이터)
GET    /api/vault/files/:path        파일 내용 조회
POST   /api/vault/files/:path        파일 생성
PUT    /api/vault/files/:path        파일 수정
PATCH  /api/vault/files/:path        파일 이동·이름 변경
DELETE /api/vault/files/:path        파일 삭제 (.trash/ 이동)
GET    /api/vault/search?q=키워드    전체 텍스트 검색
POST   /api/vault/attachments        이미지/파일 업로드
GET    /api/vault/attachments/:file  첨부파일 서빙
```

---

## Docker로 배포

```bash
# 이미지 빌드
docker build -t obsidian-web-vault .

# 실행 (vault 폴더 마운트)
docker run -d \
  -p 5173:5173 \
  -v /path/to/vault:/vault \
  -e OBSIDIAN_VAULT_DIR=/vault \
  -e BASIC_AUTH_USER=admin \
  -e BASIC_AUTH_PASSWORD=change-me \
  --name obsidian-web-vault \
  obsidian-web-vault
```

포트를 바꾸려면:
```bash
docker run -d \
  -p 8080:8080 \
  -v /path/to/vault:/vault \
  -e OBSIDIAN_VAULT_DIR=/vault \
  -e PORT=8080 \
  obsidian-web-vault
```

---

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OBSIDIAN_VAULT_DIR` | (없음) | vault 폴더 절대 경로 (미설정 시 sample 모드) |
| `PORT` | `5173` | 서버 포트 |
| `APP_LOGIN_USER` | (없음) | 세션 로그인 사용자명 |
| `APP_LOGIN_PASSWORD` | (없음) | 세션 로그인 비밀번호 |
| `SESSION_SECRET` | (없음) | 세션 쿠키 서명용 비밀값 |
| `SESSION_TTL_MS` | `604800000` | 세션 유지 시간(ms, 기본 7일) |
| `SESSION_COOKIE_NAME` | `owv_session` | 세션 쿠키 이름 |
| `BASIC_AUTH_USER` | (없음) | 설정 시 Basic Auth 사용자명 |
| `BASIC_AUTH_PASSWORD` | (없음) | 설정 시 Basic Auth 비밀번호 |
| `BASIC_AUTH_REALM` | `Obsidian Web Vault` | 브라우저 인증 프롬프트 realm |
| `RATE_LIMIT_WINDOW_MS` | `60000` | 일반 요청 제한 윈도우(ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `300` | 일반 요청 제한 횟수 |
| `AUTH_RATE_LIMIT_WINDOW_MS` | `600000` | 인증 실패 제한 윈도우(ms) |
| `AUTH_RATE_LIMIT_MAX_FAILURES` | `10` | 인증 실패 허용 횟수 |
| `SECURITY_HEADERS_ENABLED` | `true` | 기본 보안 헤더/CSP 활성화 여부 |

---

## 보안 메모

- Basic Auth는 **리버스 프록시의 HTTPS 뒤에서** 사용하는 것을 권장합니다.
- 세션 로그인도 **HTTPS 뒤에서** 사용하는 것을 권장합니다. HTTPS가 붙으면 `Secure` 쿠키 적용을 고려하세요.
- 외부에 직접 공개할 때는 평문 HTTP로 쓰지 마세요.
- 현재 프로젝트의 인증은 **단일 사용자 보호용 1차 방어선**입니다.
- 기본 rate limiting은 **메모리 기반 단일 프로세스**입니다. 여러 인스턴스를 띄우면 프록시/공유 저장소 기반 제한이 필요합니다.

### 보안 이벤트 로그

서버는 별도 로그 파일을 직접 쓰지 않고 **stdout/stderr**로 보안 이벤트를 출력합니다.

- `auth_failed` — Basic Auth 인증 실패
- `login_failed` — 세션 로그인 실패
- `login_success` — 세션 로그인 성공
- `logout` — 세션 로그아웃
- `rate_limit` — 일반 요청 제한 또는 인증 실패 제한 초과

예시:

```text
[security] {"ts":"2026-04-29T14:44:17.183Z","event":"auth_failed","ip":"127.0.0.1","method":"GET","path":"/api/vault/files","remainingFailures":1}
```

```text
[security] {"ts":"2026-04-29T14:44:17.258Z","event":"rate_limit","scope":"auth","ip":"127.0.0.1","method":"GET","path":"/api/vault/files","retryAfterSec":60}
```

PM2, Docker, systemd 같은 런타임에서는 이 stdout/stderr 출력을 그대로 수집하면 됩니다.

운영 전 나중에 다시 확인해야 할 항목은
[`docs/security-followups.md`](./docs/security-followups.md)에 체크리스트로 정리해두었습니다.

---

## 노트 규칙

- vault 루트 또는 하위 폴더에 `.md` 파일 저장
- `.git`, `.obsidian`, `node_modules`, `.trash` 폴더는 자동 제외
- 삭제된 파일은 `{vault}/.trash/` 에 보관 (수동으로 복구 가능)
- 첨부파일(이미지 등)은 `{vault}/attachments/` 에 저장

---

## 향후 계획

- **Phase 2**: 토큰 인증, HTTPS/reverse proxy 가이드
- **Phase 3**: 리치 에디터 (CodeMirror)
