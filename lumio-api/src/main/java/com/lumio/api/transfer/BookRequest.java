package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

public record BookRequest(
        @NotBlank String title,
        String description,
        String coverImageKey,
        @NotNull @Min(0) Integer orderIndex,
        Boolean required,
        List<UUID> prerequisiteBookIds,
        Integer durationMinutes,
        String level,
        String language,
        String author,
        @NotNull ContentStatus status
) {}
