package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;

import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

public record PathResponse(
        UUID id,
        String title,
        String description,
        Vertical vertical,
        String thumbnail,
        String theme,
        ContentStatus status,
        Map<String, Object> metadata,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
