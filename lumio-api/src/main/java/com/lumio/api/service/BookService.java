package com.lumio.api.service;

import com.lumio.api.domain.LumioBook;
import com.lumio.api.domain.LumioCharacter;
import com.lumio.api.domain.LumioModule;
import com.lumio.api.domain.LumioPath;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.exception.ResourceNotFoundException;
import com.lumio.api.exception.UnprocessableEntityException;
import com.lumio.api.persistence.BookRepository;
import com.lumio.api.persistence.CharacterRepository;
import com.lumio.api.persistence.ModuleRepository;
import com.lumio.api.service.mapper.BookMapper;
import com.lumio.api.transfer.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookService {

    private final BookRepository bookRepository;
    private final ModuleRepository moduleRepository;
    private final CharacterRepository characterRepository;
    private final BookMapper bookMapper;
    private final StorageService storageService;
    private final YamlParserService yamlParserService;
    private final BookValidationService bookValidationService;

    // ─── CRUD ────────────────────────────────────────────────────────────────

    public List<BookResponse> getAllForModule(UUID pathId, UUID moduleId) {
        requireModuleInPath(pathId, moduleId);
        return bookRepository.findByModuleIdOrderByOrderIndexAsc(moduleId)
                .stream()
                .map(bookMapper::toResponse)
                .toList();
    }

    public BookResponse getById(UUID pathId, UUID moduleId, UUID id) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        Map<String, String> assets = buildAssetMap(book);
        return bookMapper.toResponse(book, assets);
    }

    @Transactional
    public BookResponse create(UUID pathId, UUID moduleId, BookRequest request) {
        LumioModule module = moduleRepository.findByIdAndPathId(moduleId, pathId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Module not found: " + moduleId + " for path: " + pathId));
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
    public BookResponse update(UUID pathId, UUID moduleId, UUID id, BookRequest request) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        requireDraft(book);
        bookMapper.applyUpdate(book, request);
        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse patchStatus(UUID pathId, UUID moduleId, UUID id, ContentStatus newStatus) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        ContentStatus current = book.getStatus();

        if (current == ContentStatus.ARCHIVED) {
            throw new UnprocessableEntityException(
                    "Archived books cannot change status. Duplicate the book to create a new draft.");
        }
        if (current == ContentStatus.PUBLISHED && newStatus == ContentStatus.DRAFT) {
            throw new UnprocessableEntityException(
                    "Published books cannot be reverted to DRAFT. Archive the book instead.");
        }
        if (current == ContentStatus.DRAFT && newStatus == ContentStatus.PUBLISHED) {
            BookValidationResponse validation = bookValidationService.validate(book);
            if (!validation.ready()) {
                throw new UnprocessableEntityException(
                        "Book has structural errors and cannot be published: "
                                + String.join("; ", validation.structuralErrors()));
            }
        }

        book.setStatus(newStatus);
        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public void delete(UUID pathId, UUID moduleId, UUID id) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        if (book.getYamlKey() != null) storageService.delete(book.getYamlKey());
        if (book.getCoverImageKey() != null) storageService.delete(book.getCoverImageKey());
        bookRepository.delete(book);
    }

    // ─── Legacy YAML import (simple, no character resolution) ────────────────

    public BookPreviewResponse previewYaml(MultipartFile file) {
        return yamlParserService.parse(file);
    }

    @Transactional
    public BookResponse importYaml(UUID pathId, UUID moduleId, UUID id, MultipartFile file) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        requireDraft(book);

        if (book.getYamlKey() != null) storageService.delete(book.getYamlKey());

        BookPreviewResponse preview = yamlParserService.parse(file);
        String yamlKey = storageService.uploadYaml(file);

        book.setYamlKey(yamlKey);
        if (book.getLanguage() == null && preview.language() != null) book.setLanguage(preview.language());
        if (book.getAuthor() == null && preview.author() != null)     book.setAuthor(preview.author());
        if (book.getLevel() == null && preview.level() != null)       book.setLevel(preview.level());

        return bookMapper.toResponse(bookRepository.save(book));
    }

    @Transactional
    public BookResponse uploadCover(UUID pathId, UUID moduleId, UUID id, MultipartFile file) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        requireDraft(book);

        if (book.getCoverImageKey() != null) storageService.delete(book.getCoverImageKey());

        String coverKey = storageService.upload(file);
        book.setCoverImageKey(coverKey);
        return bookMapper.toResponse(bookRepository.save(book));
    }

    // ─── Import preview (character-conflict-aware) ───────────────────────────

    public ImportPreviewResponse importPreview(UUID pathId, UUID moduleId, UUID id, MultipartFile file) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        requireDraft(book);

        Map<String, Object> root = yamlParserService.parseRaw(file);

        int scenesCount = yamlParserService.extractScenes(root).size();
        int nodesCount = yamlParserService.extractScenes(root).stream()
                .mapToInt(s -> yamlParserService.extractNodes(s).size())
                .sum();

        List<CharacterDataDto> yamlCharacters = yamlParserService.extractCharacters(root);
        Map<String, LumioCharacter> existingBySlug = characterRepository.findByPathIdOrderByNameAsc(pathId)
                .stream().collect(Collectors.toMap(LumioCharacter::getSlug, Function.identity()));

        List<CharacterConflictDto> conflicts = buildConflicts(yamlCharacters, existingBySlug);
        List<String> structuralErrors = yamlParserService.validateStructure(root);
        List<String> warnings = yamlParserService.buildWarnings(root);

        return new ImportPreviewResponse(scenesCount, nodesCount, yamlCharacters, conflicts, structuralErrors, warnings);
    }

    // ─── Import commit (with character resolutions) ──────────────────────────

    @Transactional
    public BookResponse importCommit(UUID pathId, UUID moduleId, UUID id, ImportCommitRequest request) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        requireDraft(book);

        LumioModule module = book.getModule();
        LumioPath path = module.getPath();

        Map<String, Object> root = yamlParserService.parseRawFromString(request.yaml());
        List<CharacterDataDto> yamlCharacters = yamlParserService.extractCharacters(root);
        Map<String, LumioCharacter> existingBySlug = characterRepository.findByPathIdOrderByNameAsc(pathId)
                .stream().collect(Collectors.toMap(LumioCharacter::getSlug, Function.identity()));

        Map<String, CharacterResolutionDto.Resolution> resolutionMap = (request.characterResolutions() != null)
                ? request.characterResolutions().stream()
                        .collect(Collectors.toMap(CharacterResolutionDto::characterId, CharacterResolutionDto::resolution))
                : Map.of();

        for (CharacterDataDto yamlChar : yamlCharacters) {
            LumioCharacter existing = existingBySlug.get(yamlChar.slug());
            if (existing == null) {
                characterRepository.save(LumioCharacter.builder()
                        .path(path)
                        .slug(yamlChar.slug())
                        .name(yamlChar.name())
                        .personality(yamlChar.personality())
                        .build());
            } else if (!isIdentical(existing, yamlChar)) {
                CharacterResolutionDto.Resolution resolution = resolutionMap.get(yamlChar.slug());
                if (resolution == null) {
                    throw new UnprocessableEntityException(
                            "Missing resolution for conflicting character: '" + yamlChar.slug() + "'");
                }
                if (resolution == CharacterResolutionDto.Resolution.USE_INCOMING) {
                    existing.setName(yamlChar.name());
                    existing.setPersonality(yamlChar.personality());
                    characterRepository.save(existing);
                }
            }
        }

        if (book.getYamlKey() != null) storageService.delete(book.getYamlKey());
        String yamlKey = storageService.uploadYamlForBook(book.getId(), request.yaml());
        book.setYamlKey(yamlKey);

        return bookMapper.toResponse(bookRepository.save(book));
    }

    // ─── Validate ────────────────────────────────────────────────────────────

    public BookValidationResponse validate(UUID pathId, UUID moduleId, UUID id) {
        requireModuleInPath(pathId, moduleId);
        LumioBook book = findOrThrow(moduleId, id);
        return bookValidationService.validate(book);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<String, String> buildAssetMap(LumioBook book) {
        if (book.getYamlKey() == null) return null;
        try {
            String content = storageService.getContent(book.getYamlKey());
            Map<String, Object> root = yamlParserService.parseRawFromString(content);
            YamlParserService.AssetFilenames assetFilenames = yamlParserService.extractAssets(root);

            Map<String, String> assets = new LinkedHashMap<>();
            String bookPrefix = "books/" + book.getId();

            for (String img : assetFilenames.images()) {
                assets.put(img, storageService.getPresignedUrl(bookPrefix + "/images/" + img, 2, TimeUnit.HOURS));
            }
            for (String audio : assetFilenames.audio()) {
                assets.put(audio, storageService.getPresignedUrl(bookPrefix + "/audio/" + audio, 2, TimeUnit.HOURS));
            }
            return assets;
        } catch (Exception e) {
            LOGGER.warn("Could not build asset map for book {}: {}", book.getId(), e.getMessage());
            return null;
        }
    }

    private List<CharacterConflictDto> buildConflicts(List<CharacterDataDto> yamlChars,
                                                       Map<String, LumioCharacter> existingBySlug) {
        List<CharacterConflictDto> result = new ArrayList<>();
        for (CharacterDataDto yamlChar : yamlChars) {
            LumioCharacter existing = existingBySlug.get(yamlChar.slug());
            if (existing == null) {
                result.add(new CharacterConflictDto(
                        CharacterConflictDto.ConflictStatus.NEW, yamlChar.slug(), null, yamlChar, null));
            } else if (isIdentical(existing, yamlChar)) {
                result.add(new CharacterConflictDto(
                        CharacterConflictDto.ConflictStatus.IDENTICAL, yamlChar.slug(),
                        toData(existing), yamlChar, null));
            } else {
                result.add(new CharacterConflictDto(
                        CharacterConflictDto.ConflictStatus.CONFLICT, yamlChar.slug(),
                        toData(existing), yamlChar, buildDiff(existing, yamlChar)));
            }
        }
        return result;
    }

    private boolean isIdentical(LumioCharacter existing, CharacterDataDto incoming) {
        return Objects.equals(existing.getName(), incoming.name())
                && Objects.equals(existing.getPersonality(), incoming.personality());
    }

    private CharacterDataDto toData(LumioCharacter c) {
        return new CharacterDataDto(c.getSlug(), c.getName(), c.getPersonality());
    }

    private Map<String, CharacterConflictDto.DiffEntry> buildDiff(LumioCharacter existing, CharacterDataDto incoming) {
        Map<String, CharacterConflictDto.DiffEntry> diff = new LinkedHashMap<>();
        if (!Objects.equals(existing.getName(), incoming.name())) {
            diff.put("name", new CharacterConflictDto.DiffEntry(existing.getName(), incoming.name()));
        }
        if (!Objects.equals(existing.getPersonality(), incoming.personality())) {
            diff.put("personality", new CharacterConflictDto.DiffEntry(existing.getPersonality(), incoming.personality()));
        }
        return diff;
    }

    private void requireModuleInPath(UUID pathId, UUID moduleId) {
        if (moduleRepository.findByIdAndPathId(moduleId, pathId).isEmpty()) {
            throw new ResourceNotFoundException(
                    "Module not found: " + moduleId + " for path: " + pathId);
        }
    }

    private void requireDraft(LumioBook book) {
        if (book.getStatus() != ContentStatus.DRAFT) {
            throw new UnprocessableEntityException(
                    "Book '" + book.getId() + "' is " + book.getStatus()
                            + " and cannot be modified. Only DRAFT books are editable.");
        }
    }

    private LumioBook findOrThrow(UUID moduleId, UUID id) {
        return bookRepository.findByIdAndModuleId(id, moduleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Book not found: " + id + " for module: " + moduleId));
    }
}
