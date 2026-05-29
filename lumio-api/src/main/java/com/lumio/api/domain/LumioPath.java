package com.lumio.api.domain;

import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import jakarta.persistence.*;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Entity
@Table(name = "paths")
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
public class LumioPath extends BaseDomain {

    @Column(nullable = false)
    private String title;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Vertical vertical;

    @Column(length = 500)
    private String thumbnail;

    @Column(length = 50)
    private String theme;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ContentStatus status;

    @Builder.Default
    @OneToMany(mappedBy = "path", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LumioModule> modules = new ArrayList<>();
}
