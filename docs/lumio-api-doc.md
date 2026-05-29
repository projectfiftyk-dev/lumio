# Lumio API Documentation
**Paths & Modules — v0.1**  
Internal Draft · May 2026

---

## Overview

This document covers the first two resource groups supported by the Lumio API: Paths and Modules. These form the top two levels of the content hierarchy.

**Content hierarchy:**
```
Path  →  Module  →  Book/Episode  →  Scene  →  Node
```

All endpoints are currently open (no authentication required). Auth will be added in a later phase via Spring Security + JWT, at which point write operations will require an editor or admin role.

**Base URL**
```
http://localhost:8080/api
```

**Response Format**

All responses are JSON. Errors return a standard error object:
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Path not found with id: abc-123"
}
```

---

## 1. Paths

A Path is the top-level container for a learning journey. It defines the vertical (language, kids, learners, reader), the overall narrative arc, and hosts all characters that appear across its episodes.

### 1.1 Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/paths` | List all paths — supports search and filter |
| `GET` | `/api/paths/{id}` | Retrieve a single path by ID |
| `POST` | `/api/paths` | Create a new path |
| `PUT` | `/api/paths/{id}` | Update an existing path |
| `DELETE` | `/api/paths/{id}` | Delete a path and its modules |

---

### 1.2 Path Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Generated on creation. Used in all subsequent requests. |
| `title` | String | Yes | Display name shown in the library catalogue. |
| `description` | String | No | Short summary shown on the path card. |
| `vertical` | Enum | Yes | One of: `LANGUAGE`, `KIDS`, `LEARNERS`, `READER`. |
| `thumbnail` | String | No | MinIO object path to the cover image. |
| `theme` | String | No | Visual theme token: `warm`, `dark`, `robotic`, `forest`, `coastal`. |
| `metadata` | JSONB | No | Flexible key-value store. Used for language pairs, age range, subject, etc. depending on vertical. |
| `status` | Enum | Yes | `DRAFT` or `PUBLISHED`. Only published paths are visible to end users. |
| `created_at` | DateTime | Auto | Set on creation, never updated. |
| `updated_at` | DateTime | Auto | Updated on every write operation. |

---

### 1.3 Metadata Examples by Vertical

The `metadata` field is flexible JSONB, allowing each vertical to store its own relevant data without schema changes.

**Language**
```json
{
  "language_from": "English",
  "language_to": "Spanish",
  "level_start": "A1",
  "level_end": "B1"
}
```

**Kids**
```json
{
  "age_range": "4-8",
  "theme_world": "enchanted_forest"
}
```

**Learners**
```json
{
  "subject": "History",
  "topic": "World War II"
}
```

---

### 1.4 GET /api/paths

Returns a list of all paths. Supports optional query parameters for filtering and search.

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | String | No | Searches title and description. Case-insensitive partial match. |
| `vertical` | Enum | No | Filter by vertical: `LANGUAGE`, `KIDS`, `LEARNERS`, `READER`. |
| `status` | Enum | No | Filter by status: `DRAFT` or `PUBLISHED`. Defaults to `PUBLISHED` for non-admin requests. |

**Example Request**
```
GET /api/paths?search=germany&vertical=LANGUAGE&status=PUBLISHED
```

**Example Response**
```json
[
  {
    "id": "a1b2c3d4-e5f6-...",
    "title": "1 Year in Germany",
    "description": "Live through a full year in Berlin, from arrival to fluency.",
    "vertical": "LANGUAGE",
    "theme": "dark",
    "status": "PUBLISHED",
    "metadata": {
      "language_from": "English",
      "language_to": "German",
      "level_start": "A1",
      "level_end": "B1"
    },
    "created_at": "2026-05-29T08:00:00Z",
    "updated_at": "2026-05-29T08:00:00Z"
  }
]
```

---

### 1.5 GET /api/paths/{id}

Returns a single path by its UUID. Returns `404` if not found.

```
GET /api/paths/a1b2c3d4-e5f6-...
```

---

### 1.6 POST /api/paths

Creates a new path. Returns the created resource with generated `id` and timestamps.

**Request Body**
```json
{
  "title": "1 Year in Germany",
  "description": "Live through a full year in Berlin.",
  "vertical": "LANGUAGE",
  "theme": "dark",
  "status": "DRAFT",
  "metadata": {
    "language_from": "English",
    "language_to": "German",
    "level_start": "A1",
    "level_end": "B1"
  }
}
```

---

### 1.7 PUT /api/paths/{id}

Updates an existing path. Send the full resource body — all fields are replaced. Returns the updated resource. Returns `404` if the path does not exist.

---

### 1.8 DELETE /api/paths/{id}

Deletes a path and cascades deletion to all its modules. Returns `204 No Content` on success. Returns `404` if the path does not exist.

---

## 2. Modules

A Module is the second level of the content hierarchy, nested inside a Path. It groups a set of related episodes and provides a narrative chapter structure for the learner. Modules are ordered — the learner progresses through them sequentially.

### 2.1 Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/paths/{pathId}/modules` | List all modules for a path |
| `GET` | `/api/paths/{pathId}/modules/{id}` | Retrieve a single module |
| `POST` | `/api/paths/{pathId}/modules` | Create a module inside a path |
| `PUT` | `/api/paths/{pathId}/modules/{id}` | Update an existing module |
| `DELETE` | `/api/paths/{pathId}/modules/{id}` | Delete a module |

---

### 2.2 Module Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Generated on creation. |
| `path_id` | UUID | Auto | Set from the URL path parameter. Not included in request body. |
| `title` | String | Yes | Display name for this module. Shown in the path overview. |
| `description` | String | No | Short summary of what this module covers. |
| `thumbnail` | String | No | MinIO object path to the module cover image. |
| `order_index` | Integer | Yes | Determines display and progression order. Lower index appears first. Must be unique within the parent path. |
| `status` | Enum | Yes | `DRAFT` or `PUBLISHED`. |
| `created_at` | DateTime | Auto | Set on creation. |
| `updated_at` | DateTime | Auto | Updated on every write. |

---

### 2.3 GET /api/paths/{pathId}/modules

Returns all modules for a given path, ordered by `order_index` ascending. Returns `404` if the parent path does not exist.

**Example Response**
```json
[
  {
    "id": "m1m2m3m4-...",
    "path_id": "a1b2c3d4-...",
    "title": "Week 1 — Arrival",
    "description": "Your first days in Berlin. Airport, transport, finding your apartment.",
    "order_index": 1,
    "status": "PUBLISHED",
    "created_at": "2026-05-29T08:00:00Z",
    "updated_at": "2026-05-29T08:00:00Z"
  },
  {
    "id": "m5m6m7m8-...",
    "path_id": "a1b2c3d4-...",
    "title": "Week 2 — First Week at Work",
    "order_index": 2,
    "status": "DRAFT"
  }
]
```

---

### 2.4 POST /api/paths/{pathId}/modules

Creates a new module inside the specified path. Returns `404` if the parent path does not exist.

**Request Body**
```json
{
  "title": "Week 1 — Arrival",
  "description": "Your first days in Berlin.",
  "order_index": 1,
  "status": "DRAFT"
}
```

---

### 2.5 PUT /api/paths/{pathId}/modules/{id}

Updates an existing module. Send the full module body. Returns the updated resource. Returns `404` if either the path or module does not exist.

> **Note on order_index:** When reordering modules, update each affected module individually. There is no bulk reorder endpoint at this stage.

---

### 2.6 DELETE /api/paths/{pathId}/modules/{id}

Deletes a module. Returns `204 No Content` on success. Cascade deletion to books within the module will be handled when the Book endpoints are introduced.

---

## 3. Error Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded, resource returned. |
| `201` | Created — resource created successfully. Returns the new resource. |
| `204` | No Content — deletion succeeded. No body returned. |
| `400` | Bad Request — validation failed. Check required fields and enum values. |
| `404` | Not Found — the path or module with the given ID does not exist. |
| `500` | Internal Server Error — unexpected failure. Check server logs. |

---

## 4. What's Next

The following resource groups will be documented as they are implemented:

- `Books/Episodes` — nested under Modules
- `Characters` — nested under Paths
- `User Progress` — per user, per book
- `User Conversations` — per user, per character
- `Authentication` — JWT, roles, Spring Security

Authentication will be retrofitted onto existing endpoints — no structural changes required. Write operations (`POST`, `PUT`, `DELETE`) will require an editor or admin role. Read operations will remain public or require a valid user token depending on content status.