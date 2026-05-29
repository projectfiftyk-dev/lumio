package com.lumio.api.service;

import com.lumio.api.transfer.BookPreviewResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class YamlParserServiceTest {

    private final YamlParserService service = new YamlParserService();

    private static final String MINIMAL_YAML = """
            metadata:
              title: "Test Book"
              author: "Test Author"
              language: en
              description: "A test story"
              tags:
                - A1
            scenes:
              - id: scene_intro
                start: true
                nodes:
                  - id: n1
                    type: dialogue
                    character: narrator
                    text: "Hello"
                    next: n2
                  - id: n2
                    type: choice
                    prompt: "Choose"
                    options:
                      - label: "A"
                        next: n1
                  - id: n3
                    type: free_text
                    prompt: "Type something"
                    goal: "user types anything"
                    on_success: n1
            """;

    @Test
    void parse_extractsMetadataCorrectly() {
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml", MINIMAL_YAML.getBytes());

        BookPreviewResponse result = service.parse(file);

        assertThat(result.title()).isEqualTo("Test Book");
        assertThat(result.author()).isEqualTo("Test Author");
        assertThat(result.language()).isEqualTo("en");
        assertThat(result.description()).isEqualTo("A test story");
        assertThat(result.level()).isEqualTo("A1");
    }

    @Test
    void parse_countsNodesCorrectly() {
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml", MINIMAL_YAML.getBytes());

        BookPreviewResponse result = service.parse(file);

        assertThat(result.sceneCount()).isEqualTo(1);
        assertThat(result.nodeCount()).isEqualTo(3);
        assertThat(result.nodeTypeBreakdown()).containsEntry("dialogue", 1);
        assertThat(result.nodeTypeBreakdown()).containsEntry("choice", 1);
        assertThat(result.nodeTypeBreakdown()).containsEntry("free_text", 1);
    }

    @Test
    void parse_throwsOnEmptyFile() {
        MockMultipartFile file = new MockMultipartFile("file", "empty.yaml", "application/x-yaml", new byte[0]);

        assertThatThrownBy(() -> service.parse(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("empty or invalid");
    }

    @Test
    void parse_throwsWhenNoScenes() {
        String yaml = "metadata:\n  title: No Scenes\n";
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml", yaml.getBytes());

        assertThatThrownBy(() -> service.parse(file))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("scene");
    }

    @Test
    void parse_skipsUnsupportedNodeTypes() {
        String yaml = """
                metadata:
                  title: "Audio Book"
                scenes:
                  - id: s1
                    start: true
                    nodes:
                      - id: n1
                        type: audio
                        src: something.mp3
                      - id: n2
                        type: dialogue
                        character: narrator
                        text: "Hi"
                """;
        MockMultipartFile file = new MockMultipartFile("file", "book.yaml", "application/x-yaml", yaml.getBytes());

        BookPreviewResponse result = service.parse(file);

        assertThat(result.nodeCount()).isEqualTo(1);
        assertThat(result.nodeTypeBreakdown()).containsOnlyKeys("dialogue");
    }
}
