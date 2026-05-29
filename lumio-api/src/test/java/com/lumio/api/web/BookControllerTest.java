package com.lumio.api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.service.BookService;
import com.lumio.api.transfer.BookPreviewResponse;
import com.lumio.api.transfer.BookRequest;
import com.lumio.api.transfer.BookResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(BookController.class)
class BookControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean BookService bookService;

    private final UUID moduleId = UUID.randomUUID();

    private BookResponse sampleResponse() {
        return new BookResponse(
                UUID.randomUUID(), moduleId, "Book 1", null, null, null,
                1, false, List.of(), null, null, null, null, null,
                ContentStatus.DRAFT, OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void getAll_returns200WithList() throws Exception {
        when(bookService.getAllForModule(moduleId)).thenReturn(List.of(sampleResponse()));

        mockMvc.perform(get("/api/v1/modules/{moduleId}/books", moduleId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("Book 1"));
    }

    @Test
    void getAll_returns404_whenModuleNotFound() throws Exception {
        when(bookService.getAllForModule(moduleId))
                .thenThrow(new ResourceNotFoundException("Module not found: " + moduleId));

        mockMvc.perform(get("/api/v1/modules/{moduleId}/books", moduleId))
                .andExpect(status().isNotFound());
    }

    @Test
    void getById_returns200_whenFound() throws Exception {
        BookResponse response = sampleResponse();
        when(bookService.getById(moduleId, response.id())).thenReturn(response);

        mockMvc.perform(get("/api/v1/modules/{moduleId}/books/{id}", moduleId, response.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(response.id().toString()));
    }

    @Test
    void getById_returns404_whenNotFound() throws Exception {
        UUID bookId = UUID.randomUUID();
        when(bookService.getById(moduleId, bookId))
                .thenThrow(new ResourceNotFoundException("Book not found: " + bookId));

        mockMvc.perform(get("/api/v1/modules/{moduleId}/books/{id}", moduleId, bookId))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_returns201_withValidBody() throws Exception {
        BookRequest request = new BookRequest("Book 1", null, null, 1, false, null, null, null, null, null, ContentStatus.DRAFT);
        when(bookService.create(eq(moduleId), any())).thenReturn(sampleResponse());

        mockMvc.perform(post("/api/v1/modules/{moduleId}/books", moduleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.moduleId").value(moduleId.toString()));
    }

    @Test
    void create_returns400_whenTitleMissing() throws Exception {
        BookRequest request = new BookRequest(null, null, null, 1, false, null, null, null, null, null, ContentStatus.DRAFT);

        mockMvc.perform(post("/api/v1/modules/{moduleId}/books", moduleId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void delete_returns204() throws Exception {
        UUID bookId = UUID.randomUUID();
        mockMvc.perform(delete("/api/v1/modules/{moduleId}/books/{id}", moduleId, bookId))
                .andExpect(status().isNoContent());
    }

    @Test
    void delete_returns404_whenBookNotFound() throws Exception {
        UUID bookId = UUID.randomUUID();
        doThrow(new ResourceNotFoundException("Book not found")).when(bookService).delete(moduleId, bookId);

        mockMvc.perform(delete("/api/v1/modules/{moduleId}/books/{id}", moduleId, bookId))
                .andExpect(status().isNotFound());
    }

    @Test
    void uploadPreview_returns200_withParsedMetadata() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml",
                "metadata:\n  title: Test".getBytes());
        BookPreviewResponse preview = new BookPreviewResponse(
                "Test", null, null, null, List.of(), null, null, 1, 0, Map.of());
        when(bookService.previewYaml(any())).thenReturn(preview);

        mockMvc.perform(multipart("/api/v1/modules/{moduleId}/books/upload/preview", moduleId)
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Test"));
    }

    @Test
    void importYaml_returns200_andUpdatesBook() throws Exception {
        UUID bookId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml",
                "metadata:\n  title: Test".getBytes());
        when(bookService.importYaml(eq(moduleId), eq(bookId), any())).thenReturn(sampleResponse());

        mockMvc.perform(multipart("/api/v1/modules/{moduleId}/books/{id}/yaml", moduleId, bookId)
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Book 1"));
    }

    @Test
    void uploadCover_returns200_andUpdatesBook() throws Exception {
        UUID bookId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", new byte[]{1, 2, 3});
        when(bookService.uploadCover(eq(moduleId), eq(bookId), any())).thenReturn(sampleResponse());

        mockMvc.perform(multipart("/api/v1/modules/{moduleId}/books/{id}/cover", moduleId, bookId)
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Book 1"));
    }
}
