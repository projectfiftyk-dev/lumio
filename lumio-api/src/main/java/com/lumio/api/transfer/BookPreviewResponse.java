package com.lumio.api.transfer;

import java.util.List;
import java.util.Map;

public record BookPreviewResponse(
        String title,
        String author,
        String language,
        String description,
        List<String> tags,
        String level,
        String coverImage,
        Integer sceneCount,
        Integer nodeCount,
        Map<String, Integer> nodeTypeBreakdown
) {}
