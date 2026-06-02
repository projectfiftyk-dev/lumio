package com.lumio.api.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ContentStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static ContentStatus fromValue(String value) {
        for (ContentStatus status : values()) {
            if (status.name().equalsIgnoreCase(value)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown ContentStatus: " + value);
    }
}
