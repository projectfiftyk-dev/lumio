package com.lumio.api.transfer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CharacterResolutionDto(
        @NotBlank String characterId,
        @NotNull Resolution resolution
) {
    public enum Resolution { KEEP_EXISTING, USE_INCOMING }
}
