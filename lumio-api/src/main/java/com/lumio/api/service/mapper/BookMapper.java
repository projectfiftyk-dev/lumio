package com.lumio.api.service.mapper;

import com.lumio.api.domain.LumioBook;
import com.lumio.api.service.StorageService;
import com.lumio.api.transfer.BookRequest;
import com.lumio.api.transfer.BookResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class BookMapper {

    private final StorageService storageService;

    public BookResponse toResponse(LumioBook book) {
        return toResponse(book, null);
    }

    public BookResponse toResponse(LumioBook book, Map<String, String> assets) {
        String coverKey = book.getCoverImageKey();
        String yamlKey = book.getYamlKey();
        return new BookResponse(
                book.getId(),
                book.getModule().getId(),
                book.getTitle(),
                book.getDescription(),
                coverKey,
                toPresignedUrl(coverKey),
                book.getOrderIndex(),
                book.getRequired(),
                book.getPrerequisiteBookIds(),
                yamlKey,
                toPresignedUrl(yamlKey),
                book.getDurationMinutes(),
                book.getLevel(),
                book.getLanguage(),
                book.getAuthor(),
                book.getStatus(),
                assets,
                book.getCreatedAt(),
                book.getUpdatedAt()
        );
    }

    public void applyUpdate(LumioBook book, BookRequest request) {
        book.setTitle(request.title());
        book.setDescription(request.description());
        book.setCoverImageKey(request.coverImageKey());
        book.setOrderIndex(request.orderIndex());
        book.setRequired(request.required() != null ? request.required() : false);
        book.setPrerequisiteBookIds(request.prerequisiteBookIds() != null
                ? request.prerequisiteBookIds() : new ArrayList<>());
        book.setDurationMinutes(request.durationMinutes());
        book.setLevel(request.level());
        book.setLanguage(request.language());
        book.setAuthor(request.author());
        book.setStatus(request.status());
    }

    private String toPresignedUrl(String key) {
        return key != null ? storageService.getPresignedUrl(key) : null;
    }
}
