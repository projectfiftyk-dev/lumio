package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record BookResponse(
        UUID id,
        UUID moduleId,
        String title,
        String description,
        String coverImageKey,
        String coverImageUrl,
        Integer orderIndex,
        Boolean required,
        List<UUID> prerequisiteBookIds,
        String yamlKey,
        String yamlUrl,
        Integer durationMinutes,
        String level,
        String language,
        String author,
        ContentStatus status,
        Map<String, String> assets,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
