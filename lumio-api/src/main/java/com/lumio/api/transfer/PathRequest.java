package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record PathRequest(
        @NotBlank String title,
        String description,
        @NotNull Vertical vertical,
        String thumbnail,
        String theme,
        @NotNull ContentStatus status,
        Map<String, Object> metadata
) {}
