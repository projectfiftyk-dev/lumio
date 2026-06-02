package com.lumio.api.transfer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CharacterRequest(
        @NotBlank
        @Pattern(regexp = "^[a-z0-9_]+$", message = "slug may only contain lowercase letters, digits and underscores")
        String slug,
        @NotBlank String name,
        String description,
        String personality
) {}
