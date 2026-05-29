package com.lumio.api.domain;

import com.lumio.api.enums.ContentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "books")
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
public class LumioBook extends BaseDomain {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private LumioModule module;

    @Column(nullable = false)
    private String title;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "cover_image_key", length = 500)
    private String coverImageKey;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(nullable = false)
    private Boolean required = false;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "prerequisite_book_ids", columnDefinition = "uuid[]")
    private List<UUID> prerequisiteBookIds = new ArrayList<>();

    @Column(name = "yaml_key", length = 500)
    private String yamlKey;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(length = 50)
    private String level;

    @Column(length = 10)
    private String language;

    @Column(length = 255)
    private String author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status;
}
