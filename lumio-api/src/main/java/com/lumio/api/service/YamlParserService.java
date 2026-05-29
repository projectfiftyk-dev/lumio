package com.lumio.api.service;

import com.lumio.api.transfer.BookPreviewResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
public class YamlParserService {

    private static final Set<String> TEXT_TO_TEXT_TYPES = Set.of("dialogue", "choice", "free_text", "chat");

    @SuppressWarnings("unchecked")
    public BookPreviewResponse parse(MultipartFile file) {
        Map<String, Object> root;
        try (InputStream is = file.getInputStream()) {
            root = new Yaml().load(is);
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read YAML file: " + e.getMessage());
        }

        if (root == null) {
            throw new IllegalArgumentException("YAML file is empty or invalid");
        }

        Map<String, Object> metadata = (Map<String, Object>) root.getOrDefault("metadata", Map.of());

        String title = (String) metadata.getOrDefault("title", null);
        String author = (String) metadata.getOrDefault("author", null);
        String language = (String) metadata.getOrDefault("language", null);
        String description = (String) metadata.getOrDefault("description", null);
        String coverImage = (String) metadata.getOrDefault("cover_image", null);
        List<String> tags = (List<String>) metadata.getOrDefault("tags", List.of());

        // Level may live in metadata or settings
        String level = extractLevel(metadata, root);

        // Count scenes and nodes
        List<Map<String, Object>> scenes = (List<Map<String, Object>>) root.getOrDefault("scenes", List.of());
        if (scenes.isEmpty()) {
            throw new IllegalArgumentException("YAML must contain at least one scene");
        }

        int sceneCount = scenes.size();
        Map<String, Integer> nodeTypeBreakdown = new LinkedHashMap<>();
        int totalNodes = 0;

        for (Map<String, Object> scene : scenes) {
            List<Map<String, Object>> nodes = (List<Map<String, Object>>) scene.getOrDefault("nodes", List.of());
            for (Map<String, Object> node : nodes) {
                String type = (String) node.getOrDefault("type", "unknown");
                if (!TEXT_TO_TEXT_TYPES.contains(type)) {
                    LOGGER.warn("Skipping unsupported node type '{}' during parse", type);
                    continue;
                }
                nodeTypeBreakdown.merge(type, 1, Integer::sum);
                totalNodes++;
            }
        }

        return new BookPreviewResponse(
                title, author, language, description, tags,
                level, coverImage, sceneCount, totalNodes, nodeTypeBreakdown
        );
    }

    @SuppressWarnings("unchecked")
    private String extractLevel(Map<String, Object> metadata, Map<String, Object> root) {
        Object tagsObj = metadata.get("tags");
        if (tagsObj instanceof List<?> tags) {
            for (Object tag : tags) {
                String t = String.valueOf(tag);
                if (t.matches("[ABC][12](-[ABC][12])?")) {
                    return t;
                }
            }
        }
        Map<String, Object> settings = (Map<String, Object>) root.getOrDefault("settings", Map.of());
        return (String) settings.getOrDefault("level", null);
    }
}
