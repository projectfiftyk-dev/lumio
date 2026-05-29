package com.lumio.api.service;

import com.lumio.api.domain.LumioPath;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.PathRepository;
import com.lumio.api.service.mapper.PathMapper;
import com.lumio.api.transfer.PathRequest;
import com.lumio.api.transfer.PathResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PathServiceTest {

    @Mock PathRepository pathRepository;
    @Mock PathMapper pathMapper;

    @InjectMocks PathService pathService;

    private LumioPath samplePath;
    private PathResponse sampleResponse;
    private UUID pathId;

    @BeforeEach
    void setUp() {
        pathId = UUID.randomUUID();

        samplePath = new LumioPath();
        samplePath.setId(pathId);
        samplePath.setTitle("Test Path");
        samplePath.setVertical(Vertical.LANGUAGE);
        samplePath.setStatus(ContentStatus.DRAFT);
        samplePath.setCreatedAt(OffsetDateTime.now());
        samplePath.setUpdatedAt(OffsetDateTime.now());

        sampleResponse = new PathResponse(
                pathId, "Test Path", null, Vertical.LANGUAGE,
                null, null, ContentStatus.DRAFT, null,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void getAll_delegatesToRepository() {
        when(pathRepository.findAllWithFilters(null, null, null)).thenReturn(List.of(samplePath));
        when(pathMapper.toResponse(samplePath)).thenReturn(sampleResponse);

        List<PathResponse> result = pathService.getAll(null, null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Test Path");
    }

    @Test
    void getAll_passesEnumNamesToNativeQuery() {
        when(pathRepository.findAllWithFilters("test", Vertical.LANGUAGE.name(), ContentStatus.DRAFT.name()))
                .thenReturn(List.of(samplePath));
        when(pathMapper.toResponse(samplePath)).thenReturn(sampleResponse);

        List<PathResponse> result = pathService.getAll("test", Vertical.LANGUAGE, ContentStatus.DRAFT);

        assertThat(result).hasSize(1);
    }

    @Test
    void getById_returnsPath_whenFound() {
        when(pathRepository.findById(pathId)).thenReturn(Optional.of(samplePath));
        when(pathMapper.toResponse(samplePath)).thenReturn(sampleResponse);

        PathResponse response = pathService.getById(pathId);

        assertThat(response.id()).isEqualTo(pathId);
    }

    @Test
    void getById_throws_whenNotFound() {
        when(pathRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pathService.getById(pathId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(pathId.toString());
    }

    @Test
    void create_savesAndReturnsResponse() {
        PathRequest request = new PathRequest("Test Path", null, Vertical.LANGUAGE, null, null, ContentStatus.DRAFT, null);
        when(pathMapper.toDomain(request)).thenReturn(samplePath);
        when(pathRepository.save(samplePath)).thenReturn(samplePath);
        when(pathMapper.toResponse(samplePath)).thenReturn(sampleResponse);

        PathResponse response = pathService.create(request);

        assertThat(response.title()).isEqualTo("Test Path");
        verify(pathRepository).save(samplePath);
    }

    @Test
    void update_mergesFieldsAndSaves() {
        PathRequest request = new PathRequest("Updated", null, Vertical.KIDS, null, null, ContentStatus.PUBLISHED, null);
        when(pathRepository.findById(pathId)).thenReturn(Optional.of(samplePath));
        when(pathRepository.save(samplePath)).thenReturn(samplePath);
        when(pathMapper.toResponse(samplePath)).thenReturn(sampleResponse);

        pathService.update(pathId, request);

        verify(pathMapper).applyUpdate(samplePath, request);
        verify(pathRepository).save(samplePath);
    }

    @Test
    void delete_deletesEntity_whenFound() {
        when(pathRepository.findById(pathId)).thenReturn(Optional.of(samplePath));

        pathService.delete(pathId);

        verify(pathRepository).delete(samplePath);
    }

    @Test
    void delete_throws_whenNotFound() {
        when(pathRepository.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> pathService.delete(pathId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
