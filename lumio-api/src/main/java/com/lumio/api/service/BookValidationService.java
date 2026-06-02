package com.lumio.api.service;

import com.lumio.api.domain.LumioBook;
import com.lumio.api.transfer.BookValidationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookValidationService {

    private final StorageService storageService;
    private final YamlParserService yamlParserService;

    public BookValidationResponse validate(LumioBook book) {
        if (book.getYamlKey() == null) {
            return new BookValidationResponse(
                    false,
                    List.of("No YAML content uploaded"),
                    List.of(),
                    defaultChecklist(false, false)
            );
        }

        Map<String, Object> root;
        try {
            String content = storageService.getContent(book.getYamlKey());
            root = yamlParserService.parseRawFromString(content);
        } catch (Exception e) {
            LOGGER.warn("Failed to load YAML for book {}: {}", book.getId(), e.getMessage());
            return new BookValidationResponse(
                    false,
                    List.of("Failed to load YAML: " + e.getMessage()),
                    List.of(),
                    defaultChecklist(false, false)
            );
        }

        List<String> structuralErrors = yamlParserService.validateStructure(root);
        List<String> warnings = yamlParserService.buildWarnings(root);

        boolean audioComplete = warnings.stream().noneMatch(w -> w.contains("audio"));
        boolean imagesComplete = warnings.stream().noneMatch(w -> w.contains("background"));

        Map<String, Boolean> checklist = defaultChecklist(audioComplete, imagesComplete);

        return new BookValidationResponse(
                structuralErrors.isEmpty(),
                structuralErrors,
                warnings,
                checklist
        );
    }

    private Map<String, Boolean> defaultChecklist(boolean audioComplete, boolean imagesComplete) {
        Map<String, Boolean> checklist = new LinkedHashMap<>();
        checklist.put("content_reviewed", false);
        checklist.put("audio_complete", audioComplete);
        checklist.put("images_complete", imagesComplete);
        return checklist;
    }
}
