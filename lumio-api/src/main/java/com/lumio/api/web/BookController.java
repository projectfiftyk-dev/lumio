package com.lumio.api.web;

import com.lumio.api.service.BookService;
import com.lumio.api.transfer.BookPreviewResponse;
import com.lumio.api.transfer.BookRequest;
import com.lumio.api.transfer.BookResponse;
import com.lumio.api.transfer.StatusRequest;
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
@RequestMapping("/api/v1/modules/{moduleId}/books")
@RequiredArgsConstructor
@Tag(name = "Books", description = "Book management within a module")
public class BookController {

    private final BookService bookService;

    @GetMapping
    @Operation(summary = "List books for a module")
    List<BookResponse> getAll(@PathVariable UUID moduleId) {
        return bookService.getAllForModule(moduleId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get book by ID")
    BookResponse getById(@PathVariable UUID moduleId, @PathVariable UUID id) {
        return bookService.getById(moduleId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a book (manual, without YAML upload)")
    BookResponse create(@PathVariable UUID moduleId, @RequestBody @Valid BookRequest request) {
        return bookService.create(moduleId, request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update book metadata")
    BookResponse update(
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestBody @Valid BookRequest request) {
        return bookService.update(moduleId, id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update book status")
    BookResponse patchStatus(
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestBody @Valid StatusRequest request) {
        return bookService.patchStatus(moduleId, id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a book and its YAML from storage")
    void delete(@PathVariable UUID moduleId, @PathVariable UUID id) {
        bookService.delete(moduleId, id);
    }

    @PostMapping(value = "/upload/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Parse a YAML file and return a preview — no data is saved")
    BookPreviewResponse uploadPreview(
            @PathVariable UUID moduleId,
            @RequestPart("file") MultipartFile file) {
        return bookService.previewYaml(file);
    }

    @PostMapping(value = "/{id}/yaml", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Import YAML into an existing book — replaces any previous YAML")
    BookResponse importYaml(
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) {
        return bookService.importYaml(moduleId, id, file);
    }

    @PostMapping(value = "/{id}/cover", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a cover image for a book — replaces any previous cover")
    BookResponse uploadCover(
            @PathVariable UUID moduleId,
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file) {
        return bookService.uploadCover(moduleId, id, file);
    }
}
