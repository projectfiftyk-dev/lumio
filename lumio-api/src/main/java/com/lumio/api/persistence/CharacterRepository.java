package com.lumio.api.persistence;

import com.lumio.api.domain.LumioCharacter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CharacterRepository extends JpaRepository<LumioCharacter, UUID> {
    List<LumioCharacter> findByPathIdOrderByNameAsc(UUID pathId);
    Optional<LumioCharacter> findByIdAndPathId(UUID id, UUID pathId);
    Optional<LumioCharacter> findByPathIdAndSlug(UUID pathId, String slug);
    boolean existsByPathIdAndSlug(UUID pathId, String slug);
}
