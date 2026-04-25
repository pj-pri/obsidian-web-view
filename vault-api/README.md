# Vault API Module

이 폴더는 마크다운 vault REST API 로직을 담고 있습니다.

## 진입점

- `index.js` — 라우터 (모든 `/api/vault/*` 요청을 각 핸들러로 분배)
- `files.js` — 파일 CRUD
- `search.js` — 전체 텍스트 검색
- `attachments.js` — 첨부파일 업로드·서빙
- `utils.js` — 공통 헬퍼 (sendJson, readBody, safeJoin)

## 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/vault/files` | 파일 목록 (경로·수정일·크기, 내용 제외) |
| `GET` | `/api/vault/files/:path` | 파일 내용 단건 조회 |
| `POST` | `/api/vault/files/:path` | 파일 생성 (이미 존재하면 409) |
| `PUT` | `/api/vault/files/:path` | 파일 내용 갱신 (없으면 생성) |
| `PATCH` | `/api/vault/files/:path` | 이동·이름 변경 (`{ newPath }`) + wikilink 자동 업데이트 |
| `DELETE` | `/api/vault/files/:path` | 파일 삭제 (`.trash/` 폴더로 이동) |
| `GET` | `/api/vault/search?q=` | 파일명·본문 전체 텍스트 검색, 컨텍스트 라인 포함 |
| `POST` | `/api/vault/attachments` | 이미지·파일 업로드 (base64 JSON) |
| `GET` | `/api/vault/attachments/:file` | 첨부파일 서빙 |
| `GET` | `/api/vault` | 레거시: 전체 파일 내용 스냅샷 (하위 호환) |

## 다른 프로젝트로 이전하려면

1. 이 폴더 복사
2. `server.js`에서 `handleVaultApi(req, res, pathname)` 마운트
3. `OBSIDIAN_VAULT_DIR` 환경변수로 vault 루트 지정
4. 프론트엔드 origin에 CORS 허용 (현재 `*` 허용 중)
5. `config.js`의 `apiBaseUrl`을 해당 서버 주소로 변경

자세한 통합 가이드: [docs/rest-api-integration.md](../docs/rest-api-integration.md)
