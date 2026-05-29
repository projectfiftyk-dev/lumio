package com.lumio.api.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum Vertical {
    LANGUAGE,
    KIDS,
    LEARNERS,
    READER;

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }

    @JsonCreator
    public static Vertical fromValue(String value) {
        for (Vertical v : values()) {
            if (v.name().equalsIgnoreCase(value)) {
                return v;
            }
        }
        throw new IllegalArgumentException("Unknown Vertical: " + value);
    }
}
