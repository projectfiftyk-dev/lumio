package com.lumio.api.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "characters",
        uniqueConstraints = @UniqueConstraint(columnNames = {"path_id", "slug"}))
@Getter
@Setter
@SuperBuilder(toBuilder = true)
@NoArgsConstructor
public class LumioCharacter extends BaseDomain {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    private LumioPath path;

    @Column(nullable = false, length = 100)
    private String slug;

    @Column(nullable = false, length = 255)
    private String name;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(columnDefinition = "TEXT")
    private String description;

    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(columnDefinition = "TEXT")
    private String personality;

    @Column(name = "avatar_path", length = 500)
    private String avatarPath;

    @Column(name = "voice_id", length = 255)
    private String voiceId;
}
