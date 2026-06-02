package com.lumio.api.web;

import com.lumio.api.enums.ContentStatus;
import com.lumio.api.service.BookService;
import com.lumio.api.transfer.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/paths/{pathId}/modules/{moduleId}/books")
@RequiredArgsConstructor
@Tag(name = "Books", description = "Book management within a module")
public class BookController {

    private final BookService bookService;

    @GetMapping
    @Operation(summary = "List all books in a module")
    List<BookResponse> getAll(@PathVariable UUID pathId, @PathVariable UUID moduleId) {
        return bookService.getAllForModule(pathId, moduleId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a book by ID with pre-signed asset URLs")
    BookResponse getById(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id) {
        return bookService.getById(pathId, moduleId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a book (metadata only)")
    BookResponse create(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @RequestBody @Valid BookRequest request) {
        return bookService.create(pathId, moduleId, request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update book metadata (DRAFT only)")
    BookResponse update(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestBody @Valid BookRequest request) {
        return bookService.update(pathId, moduleId, id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update book status — enforces immutability and publish validation")
    BookResponse patchStatus(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestBody @Valid StatusRequest request) {
        return bookService.patchStatus(pathId, moduleId, id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a book and all its MinIO assets")
    void delete(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id) {
        bookService.delete(pathId, moduleId, id);
    }

    // ─── Import (character-conflict-aware) ───────────────────────────────────

    @PostMapping(value = "/{id}/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Dry-run YAML import — returns structure and character conflicts without saving")
    ImportPreviewResponse importPreview(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) {
        return bookService.importPreview(pathId, moduleId, id, file);
    }

    @PostMapping("/{id}/import/commit")
    @Operation(summary = "Commit YAML import with conflict resolution instructions")
    BookResponse importCommit(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestBody @Valid ImportCommitRequest request) {
        return bookService.importCommit(pathId, moduleId, id, request);
    }

    // ─── Validate ────────────────────────────────────────────────────────────

    @GetMapping("/{id}/validate")
    @Operation(summary = "Validate book structure — returns errors, warnings, and checklist")
    BookValidationResponse validate(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id) {
        return bookService.validate(pathId, moduleId, id);
    }

    // ─── Legacy endpoints (simple YAML import without character resolution) ───

    @PostMapping(value = "/upload/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Quick YAML parse — returns scene/node counts only, no character analysis")
    BookPreviewResponse uploadPreview(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @RequestPart("file") MultipartFile file) {
        return bookService.previewYaml(file);
    }

    @PostMapping(value = "/{id}/yaml", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Simple YAML import without character conflict resolution (DRAFT only)")
    BookResponse importYaml(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) {
        return bookService.importYaml(pathId, moduleId, id, file);
    }

    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a cover image for a book (DRAFT only)")
    BookResponse uploadCover(
            @PathVariable UUID pathId,
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) {
        return bookService.uploadCover(pathId, moduleId, id, file);
    }
}
