# API Documentation

Base URL (local): `http://localhost:4000`

All feature APIs return:

```json
{ "success": true, "message": "...", "data": {} }
```

Errors:

```json
{ "success": false, "message": "...", "data": null, "errors": [] }
```

## Health

### `GET /health`
Liveness + dependency summary.

### `GET /health/details` (also `/api/health/details`)
Ops details: memory, dependency status, config flags (no secrets).

## Documents

### `POST /api/documents/upload`
- Content-Type: `multipart/form-data`
- Field: `file` (PDF, max 20MB)
- Response: `202` with `{ documentId, jobId, status }`

### `GET /api/documents`
List documents (metadata/stats, no raw text/embeddings).

### `GET /api/documents/:id`
Single document metadata + embedding progress fields.

### `GET /api/documents/:id/status`
`{ status, failureReason, chunkCount, embeddedChunkCount, progressPercentage }`

### `GET /api/documents/:id/text?limit=&offset=`
Paginated extracted text.

### `GET /api/documents/:id/chunks?page=&limit=`
Paginated chunk previews.

### `GET /api/documents/:id/embeddings/status`
`{ chunks, embedded, remaining, progressPercentage, status }`

### `DELETE /api/documents/:id`
Deletes Mongo record, local file, chunks, and chat history.

## Search

### `POST /api/search`
```json
{ "documentId": "...", "question": "...", "topK": 5, "threshold": 0.7 }
```

## Chat (SSE)

### `POST /api/chat`
```json
{ "documentId": "...", "question": "..." }
```
Response: `text/event-stream` events `status | token | done | error`.

### `GET /api/chat/history/:documentId`
### `DELETE /api/chat/history/:documentId`

## Status codes
| Code | Meaning |
|------|---------|
| 200 | OK |
| 202 | Accepted (upload queued) |
| 400 | Validation error |
| 404 | Not found |
| 413 | File too large |
| 415 | Unsupported media |
| 429 | Rate limited |
| 500 | Server error |
| 503 | Dependency unavailable |