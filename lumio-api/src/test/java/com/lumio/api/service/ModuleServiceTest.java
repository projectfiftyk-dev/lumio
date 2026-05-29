package com.lumio.api.service;

import com.lumio.api.domain.LumioModule;
import com.lumio.api.domain.LumioPath;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.ModuleRepository;
import com.lumio.api.persistence.PathRepository;
import com.lumio.api.service.mapper.ModuleMapper;
import com.lumio.api.transfer.ModuleRequest;
import com.lumio.api.transfer.ModuleResponse;
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
class ModuleServiceTest {

    @Mock ModuleRepository moduleRepository;
    @Mock PathRepository pathRepository;
    @Mock ModuleMapper moduleMapper;

    @InjectMocks ModuleService moduleService;

    private LumioPath samplePath;
    private LumioModule sampleModule;
    private ModuleResponse sampleResponse;
    private UUID pathId;
    private UUID moduleId;

    @BeforeEach
    void setUp() {
        pathId = UUID.randomUUID();
        moduleId = UUID.randomUUID();

        samplePath = new LumioPath();
        samplePath.setId(pathId);
        samplePath.setTitle("Test Path");
        samplePath.setVertical(Vertical.LANGUAGE);
        samplePath.setStatus(ContentStatus.DRAFT);
        samplePath.setCreatedAt(OffsetDateTime.now());
        samplePath.setUpdatedAt(OffsetDateTime.now());

        sampleModule = new LumioModule();
        sampleModule.setId(moduleId);
        sampleModule.setPath(samplePath);
        sampleModule.setTitle("Module 1");
        sampleModule.setOrderIndex(1);
        sampleModule.setStatus(ContentStatus.DRAFT);
        sampleModule.setCreatedAt(OffsetDateTime.now());
        sampleModule.setUpdatedAt(OffsetDateTime.now());

        sampleResponse = new ModuleResponse(
                moduleId, pathId, "Module 1", null, null, 1, ContentStatus.DRAFT,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void getAllForPath_throws_whenPathNotFound() {
        when(pathRepository.existsById(pathId)).thenReturn(false);

        assertThatThrownBy(() -> moduleService.getAllForPath(pathId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(pathId.toString());
    }

    @Test
    void getAllForPath_returnsOrderedModules() {
        when(pathRepository.existsById(pathId)).thenReturn(true);
        when(moduleRepository.findByPathIdOrderByOrderIndexAsc(pathId)).thenReturn(List.of(sampleModule));
        when(moduleMapper.toResponse(sampleModule)).thenReturn(sampleResponse);

        List<ModuleResponse> result = moduleService.getAllForPath(pathId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Module 1");
    }

    @Test
    void create_setsPathAndSaves() {
        ModuleRequest request = new ModuleRequest("Module 1", null, null, 1, ContentStatus.DRAFT);
        when(pathRepository.findById(pathId)).thenReturn(Optional.of(samplePath));
        when(moduleRepository.save(any(LumioModule.class))).thenReturn(sampleModule);
        when(moduleMapper.toResponse(sampleModule)).thenReturn(sampleResponse);

        ModuleResponse response = moduleService.create(pathId, request);

        assertThat(response.pathId()).isEqualTo(pathId);
        verify(moduleRepository).save(any(LumioModule.class));
    }

    @Test
    void create_throws_whenPathNotFound() {
        ModuleRequest request = new ModuleRequest("Module 1", null, null, 1, ContentStatus.DRAFT);
        when(pathRepository.findById(pathId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> moduleService.create(pathId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_deletesModule() {
        when(pathRepository.existsById(pathId)).thenReturn(true);
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));

        moduleService.delete(pathId, moduleId);

        verify(moduleRepository).delete(sampleModule);
    }

    @Test
    void delete_throws_whenModuleNotFound() {
        when(pathRepository.existsById(pathId)).thenReturn(true);
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> moduleService.delete(pathId, moduleId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
