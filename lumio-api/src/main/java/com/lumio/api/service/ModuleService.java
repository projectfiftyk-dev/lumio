package com.lumio.api.service;

import com.lumio.api.domain.LumioModule;
import com.lumio.api.domain.LumioPath;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.ModuleRepository;
import com.lumio.api.persistence.PathRepository;
import com.lumio.api.service.mapper.ModuleMapper;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.transfer.ModuleRequest;
import com.lumio.api.transfer.ModuleResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final PathRepository pathRepository;
    private final ModuleMapper moduleMapper;

    public List<ModuleResponse> getAllForPath(UUID pathId) {
        requirePathExists(pathId);
        return moduleRepository.findByPathIdOrderByOrderIndexAsc(pathId)
                .stream()
                .map(moduleMapper::toResponse)
                .toList();
    }

    public ModuleResponse getById(UUID pathId, UUID id) {
        requirePathExists(pathId);
        return moduleMapper.toResponse(findOrThrow(pathId, id));
    }

    @Transactional
    public ModuleResponse create(UUID pathId, ModuleRequest request) {
        LumioPath path = pathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Path not found: " + pathId));
        LumioModule module = LumioModule.builder()
                .path(path)
                .title(request.title())
                .description(request.description())
                .thumbnail(request.thumbnail())
                .orderIndex(request.orderIndex())
                .status(request.status())
                .build();
        return moduleMapper.toResponse(moduleRepository.save(module));
    }

    @Transactional
    public ModuleResponse update(UUID pathId, UUID id, ModuleRequest request) {
        requirePathExists(pathId);
        LumioModule module = findOrThrow(pathId, id);
        moduleMapper.applyUpdate(module, request);
        return moduleMapper.toResponse(moduleRepository.save(module));
    }

    @Transactional
    public ModuleResponse patchStatus(UUID pathId, UUID id, ContentStatus status) {
        requirePathExists(pathId);
        LumioModule module = findOrThrow(pathId, id);
        module.setStatus(status);
        return moduleMapper.toResponse(moduleRepository.save(module));
    }

    @Transactional
    public void delete(UUID pathId, UUID id) {
        requirePathExists(pathId);
        moduleRepository.delete(findOrThrow(pathId, id));
    }

    private void requirePathExists(UUID pathId) {
        if (!pathRepository.existsById(pathId)) {
            throw new ResourceNotFoundException("Path not found: " + pathId);
        }
    }

    private LumioModule findOrThrow(UUID pathId, UUID id) {
        return moduleRepository.findByIdAndPathId(id, pathId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Module not found: " + id + " for path: " + pathId));
    }
}
