package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ModuleResponse(
        UUID id,
        UUID pathId,
        String title,
        String description,
        String thumbnailKey,
        String thumbnail,
        Integer orderIndex,
        ContentStatus status,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
