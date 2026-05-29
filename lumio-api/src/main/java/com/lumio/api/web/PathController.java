package com.lumio.api.web;

import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import com.lumio.api.service.PathService;
import com.lumio.api.transfer.PathRequest;
import com.lumio.api.transfer.PathResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/paths")
@RequiredArgsConstructor
@Tag(name = "Paths", description = "Learning path management")
public class PathController {

    private final PathService pathService;

    @GetMapping
    @Operation(summary = "List paths", description = "Returns all paths, optionally filtered by search term, vertical, or status")
    List<PathResponse> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Vertical vertical,
            @RequestParam(required = false) ContentStatus status) {
        return pathService.getAll(search, vertical, status);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get path by ID")
    PathResponse getById(@PathVariable UUID id) {
        return pathService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a path")
    PathResponse create(@RequestBody @Valid PathRequest request) {
        return pathService.create(request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a path")
    PathResponse update(@PathVariable UUID id, @RequestBody @Valid PathRequest request) {
        return pathService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a path")
    void delete(@PathVariable UUID id) {
        pathService.delete(id);
    }
}
