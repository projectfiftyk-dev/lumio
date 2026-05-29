package com.lumio.api.persistence;

import com.lumio.api.domain.LumioModule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ModuleRepository extends JpaRepository<LumioModule, UUID> {

    List<LumioModule> findByPathIdOrderByOrderIndexAsc(UUID pathId);

    boolean existsByPathId(UUID pathId);

    Optional<LumioModule> findByIdAndPathId(UUID id, UUID pathId);
}
