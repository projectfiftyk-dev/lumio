package com.lumio.api.transfer;

import java.util.List;

public record ImportPreviewResponse(
        int scenesCount,
        int nodesCount,
        List<CharacterDataDto> charactersInYaml,
        List<CharacterConflictDto> characterConflicts,
        List<String> structuralErrors,
        List<String> warnings
) {}
