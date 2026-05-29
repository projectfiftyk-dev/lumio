package com.lumio.api.service;

import com.lumio.api.domain.LumioPath;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.PathRepository;
import com.lumio.api.service.mapper.PathMapper;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.transfer.PathRequest;
import com.lumio.api.transfer.PathResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PathService {

    private final PathRepository pathRepository;
    private final PathMapper pathMapper;

    public List<PathResponse> getAll(String search, Vertical vertical, ContentStatus status) {
        return pathRepository.findAllWithFilters(
                        search,
                        vertical != null ? vertical.name() : null,
                        status != null ? status.name() : null)
                .stream()
                .map(pathMapper::toResponse)
                .toList();
    }

    public PathResponse getById(UUID id) {
        return pathMapper.toResponse(findOrThrow(id));
    }

    @Transactional
    public PathResponse create(PathRequest request) {
        LumioPath path = pathMapper.toDomain(request);
        return pathMapper.toResponse(pathRepository.save(path));
    }

    @Transactional
    public PathResponse update(UUID id, PathRequest request) {
        LumioPath path = findOrThrow(id);
        pathMapper.applyUpdate(path, request);
        return pathMapper.toResponse(pathRepository.save(path));
    }

    @Transactional
    public PathResponse patchStatus(UUID id, ContentStatus status) {
        LumioPath path = findOrThrow(id);
        path.setStatus(status);
        return pathMapper.toResponse(pathRepository.save(path));
    }

    @Transactional
    public void delete(UUID id) {
        pathRepository.delete(findOrThrow(id));
    }

    private LumioPath findOrThrow(UUID id) {
        return pathRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Path not found: " + id));
    }
}
