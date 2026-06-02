package com.lumio.api.web;

import com.lumio.api.service.CharacterService;
import com.lumio.api.transfer.CharacterRequest;
import com.lumio.api.transfer.CharacterResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/paths/{pathId}/characters")
@RequiredArgsConstructor
@Tag(name = "Characters", description = "Character management scoped to a path")
public class CharacterController {

    private final CharacterService characterService;

    @GetMapping
    @Operation(summary = "List all characters for a path")
    List<CharacterResponse> getAll(@PathVariable UUID pathId) {
        return characterService.getAllForPath(pathId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a character by ID")
    CharacterResponse getById(@PathVariable UUID pathId, @PathVariable UUID id) {
        return characterService.getById(pathId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a character on a path")
    CharacterResponse create(
            @PathVariable UUID pathId,
            @RequestBody @Valid CharacterRequest request) {
        return characterService.create(pathId, request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a character")
    CharacterResponse update(
            @PathVariable UUID pathId,
            @PathVariable UUID id,
            @RequestBody @Valid CharacterRequest request) {
        return characterService.update(pathId, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a character")
    void delete(@PathVariable UUID pathId, @PathVariable UUID id) {
        characterService.delete(pathId, id);
    }
}
