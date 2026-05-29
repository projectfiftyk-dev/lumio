package com.lumio.api.service;

import com.lumio.api.domain.LumioBook;
import com.lumio.api.domain.LumioModule;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.persistence.BookRepository;
import com.lumio.api.persistence.ModuleRepository;
import com.lumio.api.service.mapper.BookMapper;
import com.lumio.api.transfer.BookPreviewResponse;
import com.lumio.api.transfer.BookRequest;
import com.lumio.api.transfer.BookResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final ModuleRepository moduleRepository;
    private final BookMapper bookMapper;
    private final StorageService storageService;
    private final YamlParserService yamlParserService;

    public List<BookResponse> getAllForModule(UUID moduleId) {
        requireModuleExists(moduleId);
        return bookRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream()
                .map(bookMapper::toResponse)
                .toList();
    }

    public BookResponse getById(UUID moduleId, UUID id) {
        requireModuleExists(moduleId);
        return bookMapper.toResponse(findOrThrow(moduleId, id));
    }

    @Transactional
    public BookResponse create(UUID moduleId, BookRequest request) {
        LumioModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));
        LumioBook book = LumioBook.builder()
                .module(module)
                .title(request.title())
                .description(request.description())
                .coverImageKey(request.coverImageKey())
                .orderIndex(request.orderIndex())
                .required(request.required() != null ? request.required() : false)
                .prerequisiteBookIds(request.prerequisiteBookIds() != null
                        ? request.prerequisiteBookIds() : new ArrayList<>())
                .durationMinutes(request.durationMinutes())
                .level(request.level())
                .language(request.language())
                .author(request.author())
                .status(request.status())
                .build();
        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse update(UUID moduleId, UUID id, BookRequest request) {
        requireModuleExists(moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        bookMapper.applyUpdate(book, request);
        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse patchStatus(UUID moduleId, UUID id, ContentStatus status) {
        requireModuleExists(moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        book.setStatus(status);
        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public void delete(UUID moduleId, UUID id) {
        requireModuleExists(moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        if (book.getYamlKey() != null) {
            storageService.delete(book.getYamlKey());
        }
        bookRepository.delete(book);
    }

    public BookPreviewResponse previewYaml(MultipartFile file) {
        return yamlParserService.parse(file);
    }

    @Transactional
    public BookResponse importYaml(UUID moduleId, UUID id, MultipartFile file) {
        requireModuleExists(moduleId);
        LumioBook book = findOrThrow(moduleId, id);

        // Remove old YAML from storage before replacing
        if (book.getYamlKey() != null) {
            storageService.delete(book.getYamlKey());
        }

        BookPreviewResponse preview = yamlParserService.parse(file);
        String yamlKey = storageService.uploadYaml(file);

        book.setYamlKey(yamlKey);
        // Sync metadata fields from YAML when not already set
        if (book.getLanguage() == null && preview.language() != null) book.setLanguage(preview.language());
        if (book.getAuthor() == null && preview.author() != null) book.setAuthor(preview.author());
        if (book.getLevel() == null && preview.level() != null) book.setLevel(preview.level());

        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse uploadCover(UUID moduleId, UUID id, MultipartFile file) {
        requireModuleExists(moduleId);
        LumioBook book = findOrThrow(moduleId, id);

        // Remove old cover from storage before replacing
        if (book.getCoverImageKey() != null) {
            storageService.delete(book.getCoverImageKey());
        }

        String coverKey = storageService.upload(file);
        book.setCoverImageKey(coverKey);
        return bookMapper.toResponse(bookRepository.save(book));
    }

    private void requireModuleExists(UUID moduleId) {
        if (!moduleRepository.existsById(moduleId)) {
            throw new ResourceNotFoundException("Module not found: " + moduleId);
        }
    }

    private LumioBook findOrThrow(UUID moduleId, UUID id) {
        return bookRepository.findByIdAndModuleId(id, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Book not found: " + id + " for module: " + moduleId));
    }
}
