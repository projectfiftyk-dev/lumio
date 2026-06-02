package com.lumio.api.transfer;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record ImportCommitRequest(
        @NotBlank String yaml,
        List<CharacterResolutionDto> characterResolutions
) {}
