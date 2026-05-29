package com.lumio.api.web;

import com.lumio.api.service.ModuleService;
import com.lumio.api.transfer.ModuleRequest;
import com.lumio.api.transfer.ModuleResponse;
import com.lumio.api.transfer.StatusRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/paths/{pathId}/modules")
@RequiredArgsConstructor
@Tag(name = "Modules", description = "Module management within a learning path")
public class ModuleController {

    private final ModuleService moduleService;

    @GetMapping
    @Operation(summary = "List modules for a path")
    List<ModuleResponse> getAll(@PathVariable UUID pathId) {
        return moduleService.getAllForPath(pathId);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get module by ID")
    ModuleResponse getById(@PathVariable UUID pathId, @PathVariable UUID id) {
        return moduleService.getById(pathId, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a module")
    ModuleResponse create(@PathVariable UUID pathId, @RequestBody @Valid ModuleRequest request) {
        return moduleService.create(pathId, request);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a module")
    ModuleResponse update(
            @PathVariable UUID pathId,
            @PathVariable UUID id,
            @RequestBody @Valid ModuleRequest request) {
        return moduleService.update(pathId, id, request);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update module status")
    ModuleResponse patchStatus(
            @PathVariable UUID pathId,
            @PathVariable UUID id,
            @RequestBody @Valid StatusRequest request) {
        return moduleService.patchStatus(pathId, id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a module")
    void delete(@PathVariable UUID pathId, @PathVariable UUID id) {
        moduleService.delete(pathId, id);
    }
}
