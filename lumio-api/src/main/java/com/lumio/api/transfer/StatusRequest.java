package com.lumio.api.transfer;

import com.lumio.api.enums.ContentStatus;
import jakarta.validation.constraints.NotNull;

public record StatusRequest(@NotNull ContentStatus status) {}
