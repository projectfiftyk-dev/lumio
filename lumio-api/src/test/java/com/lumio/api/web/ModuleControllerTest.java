package com.lumio.api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.service.ModuleService;
import com.lumio.api.transfer.ModuleRequest;
import com.lumio.api.transfer.ModuleResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ModuleController.class)
class ModuleControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean ModuleService moduleService;

    private final UUID pathId = UUID.randomUUID();

    private ModuleResponse sampleResponse() {
        return new ModuleResponse(
                UUID.randomUUID(), pathId, "Week 1", null, null, 1, ContentStatus.DRAFT,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void getAll_returns200WithList() throws Exception {
        when(moduleService.getAllForPath(pathId)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/paths/{pathId}/modules", pathId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Week 1"));
    }

    @Test
    void getAll_returns404_whenPathNotFound() throws Exception {
        when(moduleService.getAllForPath(pathId))
                .thenThrow(new ResourceNotFoundException("Path not found: " + pathId));

        mockMvc.perform(get("/api/v1/paths/{pathId}/modules", pathId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_returns201_withValidBody() throws Exception {
        ModuleRequest request = new ModuleRequest("Week 1", null, null, 1, ContentStatus.DRAFT);
        when(moduleService.create(eq(pathId), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/paths/{pathId}/modules", pathId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pathId").value(pathId.toString()));
    }

    @Test
    void create_returns400_whenTitleMissing() throws Exception {
        ModuleRequest request = new ModuleRequest(null, null, null, 1, ContentStatus.DRAFT);

        mockMvc.perform(post("/api/v1/paths/{pathId}/modules", pathId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void delete_returns204() throws Exception {
        UUID moduleId = UUID.randomUUID();
        mockMvc.perform(delete("/api/v1/paths/{pathId}/modules/{id}", pathId, moduleId))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404_whenModuleNotFound() throws Exception {
        UUID moduleId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Module not found")).when(moduleService).delete(pathId, moduleId);

        mockMvc.perform(delete("/api/v1/paths/{pathId}/modules/{id}", pathId, moduleId))
                .andExpect(status().isNotFound());
    }
}
