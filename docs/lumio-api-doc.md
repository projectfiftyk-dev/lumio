# Lumio API Documentation
**Paths, Modules, Books & Characters — v0.3**  
Internal Draft · May 2026

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| v0.3 | May 2026 | Added Characters section, YAML import/preview/commit flow, book immutability rule, validation endpoint, MinIO asset structure, pre-signed URL pattern |
| v0.2 | May 2026 | Added Books/Episodes section with unlock logic, prerequisites, and YAML storage |
| v0.1 | May 2026 | Initial — Paths and Modules |

---

## Overview

This document covers the Lumio API resource groups: Paths, Modules, Books, and Characters.

**Content hierarchy:**
```
Path  →  Module  →  Book/Episode  →  Scene  →  Node
  └── Characters (scoped to Path, appear across books)
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

Deletes a path and cascades deletion to all its modules and characters. Returns `204 No Content` on success.

---

## 2. Modules

A Module is the second level of the content hierarchy, nested inside a Path. It groups a set of related books and provides a narrative chapter structure for the learner. Modules are ordered — the learner progresses through them sequentially.

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

Deletes a module. Returns `204 No Content` on success. Cascade deletion to books within the module is handled automatically.

---

## 3. Books

A Book (also called an Episode) is the core content unit — a single interactive narrative experience stored as a YAML file in MinIO. Books live inside a Module and are progressed through sequentially, with unlock logic controlling when each becomes available.

### 3.1 Book Immutability Rule

**A book in `PUBLISHED` or `ARCHIVED` status cannot be edited.** This protects users who are mid-progress on a book from encountering structural changes mid-session.

```
DRAFT     → freely editable, not visible to end users
PUBLISHED → locked, visible in catalogue, new users can start
ARCHIVED  → locked, hidden from catalogue, existing progress still completable
```

To fix a published book: duplicate it as a new DRAFT, edit the draft, publish the new version. Archive the old one once existing users have completed it.

Status transition enforcement — any write operation (`PUT`, `PUT .../content`) against a non-DRAFT book returns `422 Unprocessable Entity`.

---

### 3.2 Unlock Logic

Books use a prerequisite system to control progression. Each book declares which other books must be completed before it becomes available.

- `required` — whether this book must be completed to finish the module. Optional books (`required: false`) can be skipped without blocking module completion.
- `prerequisite_book_ids` — list of book UUIDs that must all be completed before this book unlocks. Empty array means immediately available.

**Examples:**

Linear progression:
```
Book 1 (no prerequisites) → complete → unlocks Book 2
Book 2 (prerequisite: Book 1) → complete → unlocks Book 3
```

Multi-book gate:
```
Book 1 (no prerequisites)  ─┐
                             ├─ both complete → unlocks Book 3
Book 2 (no prerequisites)  ─┘
Book 3 (prerequisites: Book 1, Book 2)
```

Optional bonus book:
```
Book 1 → complete → unlocks Book 2 (required) + Book 3 (optional)
Book 2 (required: true)  → must complete for module completion
Book 3 (required: false) → available but skippable
```

---

### 3.3 Asset Structure in MinIO

All assets for a book are stored under a single prefix keyed by book ID:

```
lumio/                          ← single bucket
├── books/
│   └── {bookId}/
│       ├── book.yaml
│       ├── audio/
│       │   ├── node_intro_1.mp3
│       │   └── node_scene_2.mp3
│       └── images/
│           ├── scene_cafe.svg
│           └── scene_street.svg
├── paths/
│   └── thumbnails/
└── modules/
    └── thumbnails/
```

The YAML stores only filenames — not full URLs:

```yaml
scenes:
  - id: cafe_arrival
    background: scene_cafe.svg
    assets:
      images: [scene_cafe.svg, scene_street.svg]
      audio: [node_intro_1.mp3]
    nodes:
      - id: intro_1
        type: dialogue
        character: sofia
        text: "Bonjour!"
        audio: node_intro_1.mp3
```

Spring Boot constructs full MinIO paths at serve time. The `assets` block per scene enables lazy loading — the server knows which assets belong to which scene without deep node parsing.

---

### 3.4 Pre-signed URL Pattern

Assets are never proxied through Spring Boot. When the frontend requests a book, the server returns pre-signed MinIO URLs that expire after the session window (default: 2 hours). The frontend loads assets directly from MinIO.

```json
{
  "book": { "...metadata..." },
  "assets": {
    "scene_cafe.svg": "https://minio/lumio/books/abc123/images/scene_cafe.svg?X-Amz-Signature=...",
    "node_intro_1.mp3": "https://minio/lumio/books/abc123/audio/node_intro_1.mp3?X-Amz-Signature=..."
  }
}
```

Pre-signed URLs are generated only after authorization checks pass. A user who has not unlocked a book never receives its asset URLs.

---

### 3.5 Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/paths/{pathId}/modules/{moduleId}/books` | List all books in a module |
| `GET` | `/api/paths/{pathId}/modules/{moduleId}/books/{id}` | Retrieve a single book with pre-signed asset URLs |
| `POST` | `/api/paths/{pathId}/modules/{moduleId}/books` | Create a book (metadata only) |
| `PUT` | `/api/paths/{pathId}/modules/{moduleId}/books/{id}` | Update book metadata (DRAFT only) |
| `DELETE` | `/api/paths/{pathId}/modules/{moduleId}/books/{id}` | Delete a book and all its MinIO assets |
| `POST` | `/api/paths/{pathId}/modules/{moduleId}/books/{id}/import/preview` | Dry-run YAML import — returns structure and character conflicts without saving |
| `POST` | `/api/paths/{pathId}/modules/{moduleId}/books/{id}/import/commit` | Commit YAML import with conflict resolution instructions |
| `GET` | `/api/paths/{pathId}/modules/{moduleId}/books/{id}/validate` | Validate book structure and return errors and warnings |

---

### 3.6 Book Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Generated on creation. |
| `module_id` | UUID | Auto | Set from the URL path parameter. |
| `title` | String | Yes | Display name for this book. |
| `description` | String | No | Short summary shown on the book card. |
| `thumbnail` | String | No | MinIO object path to the book cover image. |
| `order_index` | Integer | Yes | Display order within the module. Lower index appears first. |
| `required` | Boolean | Yes | Whether this book must be completed for module completion. Defaults to `true`. |
| `prerequisite_book_ids` | UUID[] | No | List of book IDs that must be completed before this book unlocks. Empty array means immediately available. |
| `yaml_path` | String | Auto | MinIO object path to the YAML content file. Set automatically on import commit. |
| `duration_minutes` | Integer | No | Estimated play time. Shown on the book card. |
| `level` | String | No | Difficulty level: `A1`, `A2`, `B1`, etc. |
| `status` | Enum | Yes | `DRAFT`, `PUBLISHED`, or `ARCHIVED`. Write operations blocked on non-DRAFT books. |
| `created_at` | DateTime | Auto | Set on creation. |
| `updated_at` | DateTime | Auto | Updated on every write. |

---

### 3.7 POST .../import/preview

Dry-run YAML import. Parses the uploaded YAML, extracts book structure and character definitions, and compares characters against existing path characters. **Nothing is saved.**

Returns a preview object showing the parsed structure and any character conflicts. The editor displays this before the user commits.

**Request**
```
POST /api/paths/{pathId}/modules/{moduleId}/books/{id}/import/preview
Content-Type: application/yaml

[raw YAML content]
```

**Response**
```json
{
  "scenes_count": 5,
  "nodes_count": 23,
  "characters_in_yaml": [
    { "id": "sofia", "name": "Sofia", "personality": "Café owner in Paris, warm and friendly." }
  ],
  "character_conflicts": [
    {
      "status": "CONFLICT",
      "character_id": "sofia",
      "existing": {
        "name": "Sofia",
        "personality": "Café owner, friendly."
      },
      "incoming": {
        "name": "Sofia",
        "personality": "Café owner in Paris, warm and friendly."
      },
      "diff": {
        "personality": {
          "existing": "Café owner, friendly.",
          "incoming": "Café owner in Paris, warm and friendly."
        }
      }
    }
  ],
  "new_characters": [],
  "structural_errors": [],
  "warnings": [
    "3 nodes have no audio assigned",
    "Scene 4 has no background image"
  ]
}
```

**Character conflict status values:**

| Status | Meaning |
|--------|---------|
| `NEW` | Character does not exist on this path — will be created on commit |
| `IDENTICAL` | Character exists and matches exactly — no action needed |
| `CONFLICT` | Character exists but attributes differ — resolution required before commit |

---

### 3.8 POST .../import/commit

Commits the YAML import. Saves the YAML to MinIO, updates the book record, and creates or updates characters according to the resolution instructions provided.

Must include a resolution for every `CONFLICT` character returned by the preview. `NEW` and `IDENTICAL` characters do not require a resolution entry.

**Request**
```json
{
  "yaml": "[raw YAML string]",
  "character_resolutions": [
    {
      "character_id": "sofia",
      "resolution": "USE_INCOMING"
    }
  ]
}
```

**Resolution values:**

| Value | Meaning |
|-------|---------|
| `KEEP_EXISTING` | Ignore the incoming character definition. Keep the path character unchanged. |
| `USE_INCOMING` | Replace the existing path character with the incoming definition. |

**Response**

Returns the updated book record with `yaml_path` set.

---

### 3.9 GET .../validate

Validates the book's YAML structure. Structural errors block publishing. Warnings are advisory. Checklist items require manual confirmation before status can change to `PUBLISHED`.

**Response**
```json
{
  "ready": false,
  "structural_errors": [
    "Node scene_2_node_3 references next: scene_4 which does not exist",
    "No end scene defined"
  ],
  "warnings": [
    "Scene 3 has no audio assigned",
    "3 nodes have no background image"
  ],
  "checklist": {
    "content_reviewed": false,
    "audio_complete": false,
    "images_complete": true
  }
}
```

A book with `structural_errors` cannot be published. Returns `422` if a publish attempt is made while errors exist.

---

## 4. Characters

Characters are scoped to a Path and appear across multiple books within that path. Each character accumulates conversation history per user throughout the path — they remember what was said in earlier episodes.

Characters are created either directly via the Character endpoints or automatically during a YAML import commit when a `NEW` character is detected.

### 4.1 Endpoint Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/paths/{pathId}/characters` | List all characters for a path |
| `GET` | `/api/paths/{pathId}/characters/{id}` | Retrieve a single character |
| `POST` | `/api/paths/{pathId}/characters` | Create a character |
| `PUT` | `/api/paths/{pathId}/characters/{id}` | Update a character |
| `DELETE` | `/api/paths/{pathId}/characters/{id}` | Delete a character |

---

### 4.2 Character Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Auto | Generated on creation. |
| `path_id` | UUID | Auto | Set from the URL path parameter. |
| `slug` | String | Yes | Short identifier used to reference this character in YAML files (e.g. `sofia`, `airport_officer`). Must be unique within the path. |
| `name` | String | Yes | Display name shown in the reader UI. |
| `description` | String | No | Brief human-readable description of who this character is. |
| `personality` | String | No | System prompt used for AI character chat. Defines how the character speaks, what they know, and their relationship to the learner. |
| `avatar_path` | String | No | MinIO object path to the character avatar image. Set when avatar is uploaded. |
| `voice_id` | String | No | ElevenLabs voice ID. Set when a voice is assigned in the editor. |
| `created_at` | DateTime | Auto | Set on creation. |
| `updated_at` | DateTime | Auto | Updated on every write. |

---

### 4.3 GET /api/paths/{pathId}/characters

Returns all characters for a path. Returns `404` if the path does not exist.

**Example Response**
```json
[
  {
    "id": "c1c2c3c4-...",
    "path_id": "a1b2c3d4-...",
    "slug": "sofia",
    "name": "Sofia",
    "description": "Café owner in Paris, early 40s. Warm, no-nonsense, speaks quickly.",
    "personality": "You are Sofia, a Parisian café owner. You speak French naturally and are patient with learners but don't slow down unnecessarily. You remember previous conversations with the learner.",
    "avatar_path": null,
    "voice_id": null,
    "created_at": "2026-05-29T08:00:00Z",
    "updated_at": "2026-05-29T08:00:00Z"
  }
]
```

---

### 4.4 POST /api/paths/{pathId}/characters

Creates a character on a path. The `slug` must be unique within the path — this is what YAML files use to reference the character.

**Request Body**
```json
{
  "slug": "sofia",
  "name": "Sofia",
  "description": "Café owner in Paris, early 40s. Warm and direct.",
  "personality": "You are Sofia, a Parisian café owner. You speak French naturally and are patient but don't slow down unnecessarily."
}
```

---

### 4.5 PUT /api/paths/{pathId}/characters/{id}

Updates a character. Returns the updated resource. Note: updating `personality` affects all future AI conversations for this character across all books in the path. Existing conversation history is not affected.

---

### 4.6 DELETE /api/paths/{pathId}/characters/{id}

Deletes a character. Returns `204 No Content`. Does not delete conversation history — user progress records referencing this character are preserved for historical accuracy.

> **Warning:** Deleting a character that is referenced in a published book's YAML will cause reader errors at those nodes. Validate all published books after a character deletion.

---

## 5. Error Codes

| Code | Meaning |
|------|---------|
| `200` | OK — request succeeded, resource returned. |
| `201` | Created — resource created successfully. Returns the new resource. |
| `204` | No Content — deletion succeeded. No body returned. |
| `400` | Bad Request — validation failed. Check required fields and enum values. |
| `404` | Not Found — the resource with the given ID does not exist. |
| `409` | Conflict — slug already exists on this path, or prerequisite_book_ids references a book outside this module. |
| `422` | Unprocessable Entity — attempted to edit a non-DRAFT book, or attempted to publish a book with structural errors. |
| `500` | Internal Server Error — unexpected failure. Check server logs. |

---

## 6. What's Next

The following resource groups will be documented as they are implemented:

- `User Progress` — per user, per book. Includes current scene, current node, choice history (JSONB), and completed flag. Used to compute `unlocked` state on book responses.
- `User Conversations` — per user, per character. Stores full message history as JSONB. Passed as context on every AI character call.
- `Authentication` — JWT, roles, Spring Security. Write operations will require editor or admin role. Read operations remain public or require valid user token depending on content status.
- `Audio Generation` — ElevenLabs integration. Generate and attach MP3s to dialogue nodes via the editor.
- `Image Generation` — AI scene image generation and upload. Attach SVG or image assets to scene nodes via the editor.

Authentication will be retrofitted onto existing endpoints — no structural changes required. Once active, pre-signed URL generation will enforce subscription and unlock checks per user.