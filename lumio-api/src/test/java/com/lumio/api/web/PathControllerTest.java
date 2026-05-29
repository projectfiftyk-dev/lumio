package com.lumio.api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.service.PathService;
import com.lumio.api.transfer.PathRequest;
import com.lumio.api.transfer.PathResponse;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PathController.class)
class PathControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean PathService pathService;

    private PathResponse sampleResponse() {
        return new PathResponse(
                UUID.randomUUID(), "Test Path", null, Vertical.LANGUAGE,
                null, null, ContentStatus.DRAFT, null,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void getAll_returns200WithList() throws Exception {
        when(pathService.getAll(null, null, null)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/paths"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Test Path"));
    }

    @Test
    void getById_returns200_whenFound() throws Exception {
        PathResponse response = sampleResponse();
        when(pathService.getById(response.id())).thenReturn(response);

        mockMvc.perform(get("/api/v1/paths/{id}", response.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(response.id().toString()));
    }

    @Test
    void getById_returns404_whenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(pathService.getById(id)).thenThrow(new ResourceNotFoundException("Path not found: " + id));

        mockMvc.perform(get("/api/v1/paths/{id}", id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void create_returns201_withValidBody() throws Exception {
        PathRequest request = new PathRequest("New Path", null, Vertical.LANGUAGE, null, null, ContentStatus.DRAFT, null);
        when(pathService.create(any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/paths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    void create_returns400_whenTitleMissing() throws Exception {
        PathRequest request = new PathRequest(null, null, Vertical.LANGUAGE, null, null, ContentStatus.DRAFT, null);

        mockMvc.perform(post("/api/v1/paths")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void delete_returns204_whenFound() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(delete("/api/v1/paths/{id}", id))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404_whenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Path not found: " + id)).when(pathService).delete(id);

        mockMvc.perform(delete("/api/v1/paths/{id}", id))
                .andExpect(status().isNotFound());
    }
}
