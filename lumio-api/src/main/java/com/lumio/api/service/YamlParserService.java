package com.lumio.api.service;

import com.lumio.api.transfer.BookPreviewResponse;
import com.lumio.api.transfer.CharacterDataDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.yaml.snakeyaml.Yaml;

import java.io.IOException;
import java.io.InputStream;
import java.io.StringReader;
import java.util.*;

@Slf4j
@Service
public class YamlParserService {

    private static final Set<String> SUPPORTED_NODE_TYPES = Set.of("dialogue", "choice", "free_text", "chat");

    public record AssetFilenames(Set<String> images, Set<String> audio) {}

    public BookPreviewResponse parse(MultipartFile file) {
        Map<String, Object> root = parseRaw(file);
        return buildPreview(root);
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> parseRaw(MultipartFile file) {
        try (InputStream is = file.getInputStream()) {
            Map<String, Object> root = new Yaml().load(is);
            if (root == null) throw new IllegalArgumentException("YAML file is empty or invalid");
            return root;
        } catch (IOException e) {
            throw new IllegalArgumentException("Failed to read YAML file: " + e.getMessage());
        }
    }

    public Map<String, Object> parseRawFromString(String yaml) {
        Map<String, Object> root = new Yaml().load(new StringReader(yaml));
        if (root == null) throw new IllegalArgumentException("YAML content is empty or invalid");
        return root;
    }

    @SuppressWarnings("unchecked")
    public List<CharacterDataDto> extractCharacters(Map<String, Object> root) {
        List<Map<String, Object>> chars =
                (List<Map<String, Object>>) root.getOrDefault("characters", List.of());
        return chars.stream()
                .map(c -> new CharacterDataDto(
                        (String) c.get("id"),
                        (String) c.getOrDefault("name", ""),
                        (String) c.get("personality")
                ))
                .filter(c -> c.slug() != null && !c.slug().isBlank())
                .toList();
    }

    @SuppressWarnings("unchecked")
    public AssetFilenames extractAssets(Map<String, Object> root) {
        Set<String> images = new LinkedHashSet<>();
        Set<String> audio = new LinkedHashSet<>();

        for (Map<String, Object> scene : extractScenes(root)) {
            String bg = (String) scene.get("background");
            if (bg != null) images.add(bg);

            Map<String, Object> assets =
                    (Map<String, Object>) scene.getOrDefault("assets", Map.of());
            List<String> imgs = (List<String>) assets.getOrDefault("images", List.of());
            images.addAll(imgs);
            List<String> aud = (List<String>) assets.getOrDefault("audio", List.of());
            audio.addAll(aud);

            for (Map<String, Object> node : extractNodes(scene)) {
                String nodeAudio = (String) node.get("audio");
                if (nodeAudio != null) audio.add(nodeAudio);
            }
        }

        return new AssetFilenames(images, audio);
    }

    public List<String> validateStructure(Map<String, Object> root) {
        List<String> errors = new ArrayList<>();
        List<Map<String, Object>> scenes = extractScenes(root);

        if (scenes.isEmpty()) {
            errors.add("YAML must contain at least one scene");
            return errors;
        }

        Set<String> sceneIds = new HashSet<>();
        for (Map<String, Object> scene : scenes) {
            String sid = (String) scene.get("id");
            if (sid == null) {
                errors.add("A scene is missing its 'id' field");
            } else {
                sceneIds.add(sid);
            }
        }

        boolean hasTerminal = false;
        for (Map<String, Object> scene : scenes) {
            for (Map<String, Object> node : extractNodes(scene)) {
                Object next = node.get("next");
                if (next instanceof String nextScene && !nextScene.isBlank()) {
                    if (!sceneIds.contains(nextScene)) {
                        errors.add("Node '" + node.get("id") + "' references next: '"
                                + nextScene + "' which does not exist");
                    }
                } else {
                    hasTerminal = true;
                }
                if ("end".equals(node.get("type"))) hasTerminal = true;
            }
        }

        if (!hasTerminal) {
            errors.add("No end scene defined — every node has a 'next' reference");
        }

        return errors;
    }

    public List<String> buildWarnings(Map<String, Object> root) {
        List<String> warnings = new ArrayList<>();
        int missAudio = 0;
        int missBg = 0;

        for (Map<String, Object> scene : extractScenes(root)) {
            if (scene.get("background") == null) missBg++;
            for (Map<String, Object> node : extractNodes(scene)) {
                if ("dialogue".equals(node.get("type")) && node.get("audio") == null) missAudio++;
            }
        }

        if (missAudio > 0) warnings.add(missAudio + " dialogue node(s) have no audio assigned");
        if (missBg > 0) warnings.add(missBg + " scene(s) have no background image");

        return warnings;
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> extractScenes(Map<String, Object> root) {
        return (List<Map<String, Object>>) root.getOrDefault("scenes", List.of());
    }

    @SuppressWarnings("unchecked")
    public List<Map<String, Object>> extractNodes(Map<String, Object> scene) {
        return (List<Map<String, Object>>) scene.getOrDefault("nodes", List.of());
    }

    @SuppressWarnings("unchecked")
    private BookPreviewResponse buildPreview(Map<String, Object> root) {
        Map<String, Object> metadata = (Map<String, Object>) root.getOrDefault("metadata", Map.of());

        String title       = (String) metadata.getOrDefault("title", null);
        String author      = (String) metadata.getOrDefault("author", null);
        String language    = (String) metadata.getOrDefault("language", null);
        String description = (String) metadata.getOrDefault("description", null);
        String coverImage  = (String) metadata.getOrDefault("cover_image", null);
        List<String> tags  = (List<String>) metadata.getOrDefault("tags", List.of());
        String level       = extractLevel(metadata, root);

        List<Map<String, Object>> scenes = extractScenes(root);
        if (scenes.isEmpty()) throw new IllegalArgumentException("YAML must contain at least one scene");

        int sceneCount = scenes.size();
        Map<String, Integer> nodeTypeBreakdown = new LinkedHashMap<>();
        int totalNodes = 0;

        for (Map<String, Object> scene : scenes) {
            for (Map<String, Object> node : extractNodes(scene)) {
                String type = (String) node.getOrDefault("type", "unknown");
                if (!SUPPORTED_NODE_TYPES.contains(type)) {
                    LOGGER.warn("Skipping unsupported node type '{}' during parse", type);
                    continue;
                }
                nodeTypeBreakdown.merge(type, 1, Integer::sum);
                totalNodes++;
            }
        }

        return new BookPreviewResponse(title, author, language, description, tags,
                level, coverImage, sceneCount, totalNodes, nodeTypeBreakdown);
    }

    @SuppressWarnings("unchecked")
    private String extractLevel(Map<String, Object> metadata, Map<String, Object> root) {
        Object tagsObj = metadata.get("tags");
        if (tagsObj instanceof List<?> tags) {
            for (Object tag : tags) {
                String t = String.valueOf(tag);
                if (t.matches("[ABC][12](-[ABC][12])?")) return t;
            }
        }
        Map<String, Object> settings = (Map<String, Object>) root.getOrDefault("settings", Map.of());
        return (String) settings.getOrDefault("level", null);
    }
}
