# REST API Integration

## 개요

프론트엔드는 두 가지 방식으로 마크다운 노트를 로드합니다.

- **같은 프로젝트**: 로컬 Node 서버에서 `/api/vault/*` 제공
- **별도 서비스**: 동일한 API 계약을 구현한 외부 서버

## 프론트엔드 설정

`config.js`에서 `window.OBSIDIAN_WEB_VAULT_CONFIG.apiBaseUrl`을 설정합니다.

```js
// config.js
window.OBSIDIAN_WEB_VAULT_CONFIG = {
  apiBaseUrl: '',  // 기본: 같은 호스트/포트
};
```

별도 API 서버를 쓸 경우:

```js
window.OBSIDIAN_WEB_VAULT_CONFIG = {
  apiBaseUrl: 'http://localhost:4010',
};
```

## 엔드포인트 목록

### 파일 목록

```http
GET /api/vault/files
```

```json
{
  "files": [
    { "path": "folder/note.md", "mtime": 1714000000000, "size": 1024 }
  ]
}
```

### 파일 단건 조회

```http
GET /api/vault/files/folder/note.md
```

```json
{ "path": "folder/note.md", "content": "# Hello\n" }
```

### 파일 생성

```http
POST /api/vault/files/new-note.md
Content-Type: application/json

{ "content": "# New Note\n" }
```

성공: `201 Created` | 이미 존재: `409 Conflict`

### 파일 수정

```http
PUT /api/vault/files/note.md
Content-Type: application/json

{ "content": "# Updated\n" }
```

### 파일 이동·이름 변경

```http
PATCH /api/vault/files/old-name.md
Content-Type: application/json

{ "newPath": "folder/new-name.md" }
```

응답에 wikilink가 업데이트된 파일 목록 포함:

```json
{ "path": "folder/new-name.md", "updatedRefs": ["other-note.md"] }
```

### 파일 삭제

```http
DELETE /api/vault/files/note.md
```

`.trash/` 폴더로 이동 (복구 가능):

```json
{ "trashed": "note.md" }
```

### 전체 텍스트 검색

```http
GET /api/vault/search?q=검색어
```

```json
{
  "query": "검색어",
  "results": [
    {
      "path": "folder/note.md",
      "nameMatch": false,
      "contexts": [
        { "line": "여기에 검색어가 있습니다", "lineNo": 5 }
      ]
    }
  ]
}
```

### 첨부파일 업로드

```http
POST /api/vault/attachments
Content-Type: application/json

{ "filename": "image.png", "data": "data:image/png;base64,iVBOR..." }
```

```json
{ "path": "attachments/image.png", "filename": "image.png" }
```

### 첨부파일 서빙

```http
GET /api/vault/attachments/image.png
```

### 레거시 스냅샷 (하위 호환)

```http
GET /api/vault
```

전체 파일 내용을 한 번에 반환합니다. 규모가 작은 vault에 적합합니다.

## 프론트엔드 초기화 흐름

```
1. GET /api/vault 호출
2. 200 OK → server 모드 (CRUD 전체 활성)
3. 실패  → localStorage 세션 확인
4. 없음  → 내장 샘플 vault
```

## 에러 응답

모든 에러는 JSON으로 반환됩니다:

```json
{ "error": "설명 메시지" }
```

| 상태 코드 | 의미 |
|-----------|------|
| `400` | 잘못된 경로 또는 입력 |
| `404` | 파일 없음 |
| `405` | 허용되지 않는 메서드 |
| `409` | 이미 존재 (POST 시) |
| `503` | OBSIDIAN_VAULT_DIR 미설정 |

## 보안

- 경로 트래버설(`../`) 차단: 모든 경로는 vault 루트 내로 제한
- Basic Auth를 켜려면 서버 환경변수 `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`를 함께 설정
- 기본 rate limiting 헤더(`RateLimit-*`)와 `429 Too Many Requests` 응답 지원
- 기본 보안 헤더/CSP는 `SECURITY_HEADERS_ENABLED=true`일 때 활성화
- CORS: 현재 `Access-Control-Allow-Origin: *` (토큰/세분화는 후속 Phase 2 작업)
