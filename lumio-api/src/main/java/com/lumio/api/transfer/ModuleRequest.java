package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ModuleRequest(
        @NotBlank String title,
        String description,
        String thumbnail,
        @NotNull @Min(0) Integer orderIndex,
        @NotNull ContentStatus status
) {}
