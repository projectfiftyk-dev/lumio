package com.lumio.api.service;

import com.lumio.api.domain.LumioBook;
import com.lumio.api.domain.LumioModule;
import com.lumio.api.domain.LumioPath;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.BookRepository;
import com.lumio.api.persistence.CharacterRepository;
import com.lumio.api.persistence.ModuleRepository;
import com.lumio.api.service.mapper.BookMapper;
import com.lumio.api.transfer.BookPreviewResponse;
import com.lumio.api.transfer.BookRequest;
import com.lumio.api.transfer.BookResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookServiceTest {

    @Mock BookRepository bookRepository;
    @Mock ModuleRepository moduleRepository;
    @Mock CharacterRepository characterRepository;
    @Mock BookMapper bookMapper;
    @Mock StorageService storageService;
    @Mock YamlParserService yamlParserService;
    @Mock BookValidationService bookValidationService;

    @InjectMocks BookService bookService;

    private LumioPath samplePath;
    private LumioModule sampleModule;
    private LumioBook sampleBook;
    private BookResponse sampleResponse;
    private UUID pathId;
    private UUID moduleId;
    private UUID bookId;

    @BeforeEach
    void setUp() {
        pathId   = UUID.randomUUID();
        moduleId = UUID.randomUUID();
        bookId   = UUID.randomUUID();

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

        sampleBook = new LumioBook();
        sampleBook.setId(bookId);
        sampleBook.setModule(sampleModule);
        sampleBook.setTitle("Book 1");
        sampleBook.setOrderIndex(1);
        sampleBook.setRequired(false);
        sampleBook.setStatus(ContentStatus.DRAFT);
        sampleBook.setCreatedAt(OffsetDateTime.now());
        sampleBook.setUpdatedAt(OffsetDateTime.now());

        sampleResponse = new BookResponse(
                bookId, moduleId, "Book 1", null, null, null,
                1, false, List.of(), null, null, null, null, null, null,
                ContentStatus.DRAFT, null,
                OffsetDateTime.now(), OffsetDateTime.now()
        );
    }

    @Test
    void getAllForModule_throws_whenModuleNotFound() {
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.getAllForModule(pathId, moduleId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining(moduleId.toString());
    }

    @Test
    void getAllForModule_returnsOrderedBooks() {
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));
        when(bookRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)).thenReturn(List.of(sampleBook));
        when(bookMapper.toResponse(sampleBook)).thenReturn(sampleResponse);

        List<BookResponse> result = bookService.getAllForModule(pathId, moduleId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Book 1");
    }

    @Test
    void create_setsModuleAndSaves() {
        BookRequest request = new BookRequest("Book 1", null, null, 1, false, null, null, null, null, null, ContentStatus.DRAFT);
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));
        when(bookRepository.save(any(LumioBook.class))).thenReturn(sampleBook);
        when(bookMapper.toResponse(sampleBook)).thenReturn(sampleResponse);

        BookResponse response = bookService.create(pathId, moduleId, request);

        assertThat(response.moduleId()).isEqualTo(moduleId);
        verify(bookRepository).save(any(LumioBook.class));
    }

    @Test
    void create_throws_whenModuleNotFound() {
        BookRequest request = new BookRequest("Book 1", null, null, 1, false, null, null, null, null, null, ContentStatus.DRAFT);
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.create(pathId, moduleId, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void delete_deletesYamlFromStorageAndEntity() {
        sampleBook.setYamlKey("books/some-uuid.yaml");
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));
        when(bookRepository.findByIdAndModuleId(bookId, moduleId)).thenReturn(Optional.of(sampleBook));

        bookService.delete(pathId, moduleId, bookId);

        verify(storageService).delete("books/some-uuid.yaml");
        verify(bookRepository).delete(sampleBook);
    }

    @Test
    void delete_throws_whenBookNotFound() {
        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));
        when(bookRepository.findByIdAndModuleId(bookId, moduleId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookService.delete(pathId, moduleId, bookId))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void previewYaml_delegatesToParser() {
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml",
                "metadata:\n  title: Test".getBytes());
        BookPreviewResponse expected = new BookPreviewResponse(
                "Test", null, null, null, List.of(), null, null, 1, 0, Map.of());
        when(yamlParserService.parse(file)).thenReturn(expected);

        BookPreviewResponse result = bookService.previewYaml(file);

        assertThat(result.title()).isEqualTo("Test");
        verify(yamlParserService).parse(file);
    }

    @Test
    void importYaml_replacesOldYamlAndSaves() {
        sampleBook.setYamlKey("books/old-uuid.yaml");
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml",
                "metadata:\n  title: New Content".getBytes());
        BookPreviewResponse preview = new BookPreviewResponse(
                "New Content", "Author", "en", "desc", List.of(), "A1", null, 1, 2, Map.of("dialogue", 2));

        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));
        when(bookRepository.findByIdAndModuleId(bookId, moduleId)).thenReturn(Optional.of(sampleBook));
        when(yamlParserService.parse(file)).thenReturn(preview);
        when(storageService.uploadYaml(file)).thenReturn("books/new-uuid.yaml");
        when(bookRepository.save(sampleBook)).thenReturn(sampleBook);
        when(bookMapper.toResponse(sampleBook)).thenReturn(sampleResponse);

        BookResponse response = bookService.importYaml(pathId, moduleId, bookId, file);

        assertThat(response).isNotNull();
        verify(storageService).delete("books/old-uuid.yaml");
        verify(storageService).uploadYaml(file);
        verify(bookRepository).save(sampleBook);
    }

    @Test
    void uploadCover_replacesOldCoverAndSaves() {
        sampleBook.setCoverImageKey("thumbnails/old.jpg");
        MockMultipartFile file = new MockMultipartFile("file", "cover.jpg", "image/jpeg", new byte[]{1, 2, 3});

        when(moduleRepository.findByIdAndPathId(moduleId, pathId)).thenReturn(Optional.of(sampleModule));
        when(bookRepository.findByIdAndModuleId(bookId, moduleId)).thenReturn(Optional.of(sampleBook));
        when(storageService.upload(file)).thenReturn("thumbnails/new.jpg");
        when(bookRepository.save(sampleBook)).thenReturn(sampleBook);
        when(bookMapper.toResponse(sampleBook)).thenReturn(sampleResponse);

        BookResponse response = bookService.uploadCover(pathId, moduleId, bookId, file);

        assertThat(response).isNotNull();
        verify(storageService).delete("thumbnails/old.jpg");
        verify(storageService).upload(file);
        verify(bookRepository).save(sampleBook);
    }
}
