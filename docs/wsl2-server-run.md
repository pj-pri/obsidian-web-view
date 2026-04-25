# 서버 실행 가이드

## 기본 실행

### 샘플 vault (파일 불필요)

```bash
node server.js
```

브라우저에서 `http://localhost:5173` 열기

### 실제 vault 연결

**.env 파일 사용 (권장)**

```bash
cp .env.example .env
# .env 파일에서 OBSIDIAN_VAULT_DIR 경로 수정
node server.js
```

**환경변수 직접 지정**

```bash
OBSIDIAN_VAULT_DIR=/path/to/vault node server.js
```

**포트 변경**

```bash
PORT=8080 node server.js
```

## Docker로 실행

```bash
# 이미지 빌드
docker build -t obsidian-web-vault .

# 실행
docker run -d \
  -p 5173:5173 \
  -v /path/to/vault:/vault \
  -e OBSIDIAN_VAULT_DIR=/vault \
  --name obsidian-web-vault \
  obsidian-web-vault
```

## WSL2 환경

### 경로는 Linux 형식으로

```bash
# 올바른 형식
OBSIDIAN_VAULT_DIR="/mnt/c/Users/<you>/Documents/MyVault"

# 잘못된 형식
OBSIDIAN_VAULT_DIR="C:\Users\<you>\Documents\MyVault"
```

### Windows 브라우저에서 접근

WSL2 내부에서 서버가 실행 중이면 Windows 브라우저에서 `http://localhost:5173`으로 접근할 수 있습니다.

접근이 안 되면 포트 사용 여부 확인:

```bash
ss -ltnp | grep ':5173'
```

## 환경변수

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `OBSIDIAN_VAULT_DIR` | (없음) | vault 폴더 절대 경로. 미설정 시 샘플 모드 |
| `PORT` | `5173` | 서버 포트 |

## 동작 모드

| 모드 | 조건 | 기능 |
|------|------|------|
| **server** | `OBSIDIAN_VAULT_DIR` 설정됨 | 읽기·쓰기·삭제·검색 전체 |
| **local** | 이전 브라우저 세션 존재 | 브라우저 localStorage 저장 |
| **sample** | 그 외 | 내장 샘플 파일, 읽기 전용 |

현재 모드는 화면 우하단 상태바에 표시됩니다.

## 스모크 테스트

서버 시작 후 API 정상 동작 확인:

```bash
# 파일 목록
curl -s http://localhost:5173/api/vault/files

# 전체 텍스트 검색
curl -s "http://localhost:5173/api/vault/search?q=hello"

# 파일 생성
curl -s -X POST -H 'Content-Type: application/json' \
  -d '{"content":"# Test\n"}' \
  http://localhost:5173/api/vault/files/test.md
```

## 제외되는 폴더

vault 내 다음 폴더는 자동으로 제외됩니다:

- `.git`, `.obsidian`, `node_modules`, `.trash`
- `.`으로 시작하는 숨김 폴더

## 서버 종료

현재 터미널에서 실행 중: `Ctrl+C`

백그라운드 프로세스 종료:

```bash
pkill -f "node server.js"
```
