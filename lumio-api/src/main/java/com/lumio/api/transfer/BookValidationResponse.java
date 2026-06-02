package com.lumio.api.transfer;

import java.util.List;
import java.util.Map;

public record BookValidationResponse(
        boolean ready,
        List<String> structuralErrors,
        List<String> warnings,
        Map<String, Boolean> checklist
) {}
