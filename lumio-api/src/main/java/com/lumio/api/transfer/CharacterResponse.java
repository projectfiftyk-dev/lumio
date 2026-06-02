package com.lumio.api.transfer;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CharacterResponse(
        UUID id,
        UUID pathId,
        String slug,
        String name,
        String description,
        String personality,
        String avatarPath,
        String voiceId,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
