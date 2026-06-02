package com.lumio.api.transfer;

import java.util.Map;

public record CharacterConflictDto(
        ConflictStatus status,
        String characterId,
        CharacterDataDto existing,
        CharacterDataDto incoming,
        Map<String, DiffEntry> diff
) {
    public enum ConflictStatus { NEW, IDENTICAL, CONFLICT }
    public record DiffEntry(String existing, String incoming) {}
}
