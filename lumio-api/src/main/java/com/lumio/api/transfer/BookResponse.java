package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;

import java.time.OffsetDateTime;
import java.util.List;
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
        Integer durationMinutes,
        String level,
        String language,
        String author,
        ContentStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
