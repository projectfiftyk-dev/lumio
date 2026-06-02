package com.lumio.api.service;

import com.lumio.api.domain.LumioCharacter;
import com.lumio.api.domain.LumioPath;
import com.lumio.api.exception.ConflictException;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.CharacterRepository;
import com.lumio.api.persistence.PathRepository;
import com.lumio.api.service.mapper.CharacterMapper;
import com.lumio.api.transfer.CharacterRequest;
import com.lumio.api.transfer.CharacterResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CharacterService {

    private final CharacterRepository characterRepository;
    private final PathRepository pathRepository;
    private final CharacterMapper characterMapper;

    public List<CharacterResponse> getAllForPath(UUID pathId) {
        requirePathExists(pathId);
        return characterRepository.findByPathIdOrderByNameAsc(pathId)
                .stream()
                .map(characterMapper::toResponse)
                .toList();
    }

    public CharacterResponse getById(UUID pathId, UUID id) {
        requirePathExists(pathId);
        return characterMapper.toResponse(findOrThrow(pathId, id));
    }

    @Transactional
    public CharacterResponse create(UUID pathId, CharacterRequest request) {
        LumioPath path = pathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Path not found: " + pathId));
        if (characterRepository.existsByPathIdAndSlug(pathId, request.slug())) {
            throw new ConflictException("Character with slug '" + request.slug() + "' already exists on this path");
        }
        LumioCharacter character = LumioCharacter.builder()
                .path(path)
                .slug(request.slug())
                .name(request.name())
                .description(request.description())
                .personality(request.personality())
                .build();
        return characterMapper.toResponse(characterRepository.save(character));
    }

    @Transactional
    public CharacterResponse update(UUID pathId, UUID id, CharacterRequest request) {
        requirePathExists(pathId);
        LumioCharacter character = findOrThrow(pathId, id);
        if (!character.getSlug().equals(request.slug())
                && characterRepository.existsByPathIdAndSlug(pathId, request.slug())) {
            throw new ConflictException("Character with slug '" + request.slug() + "' already exists on this path");
        }
        characterMapper.applyUpdate(character, request);
        return characterMapper.toResponse(characterRepository.save(character));
    }

    @Transactional
    public void delete(UUID pathId, UUID id) {
        requirePathExists(pathId);
        LumioCharacter character = findOrThrow(pathId, id);
        characterRepository.delete(character);
    }

    private void requirePathExists(UUID pathId) {
        if (!pathRepository.existsById(pathId)) {
            throw new ResourceNotFoundException("Path not found: " + pathId);
        }
    }

    private LumioCharacter findOrThrow(UUID pathId, UUID id) {
        return characterRepository.findByIdAndPathId(id, pathId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Character not found: " + id + " for path: " + pathId));
    }
}
