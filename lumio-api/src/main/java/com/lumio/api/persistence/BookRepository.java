package com.lumio.api.persistence;

import com.lumio.api.domain.LumioBook;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BookRepository extends JpaRepository<LumioBook, UUID> {

    List<LumioBook> findByModuleIdOrderByOrderIndexAsc(UUID moduleId);

    boolean existsByModuleId(UUID moduleId);

    Optional<LumioBook> findByIdAndModuleId(UUID id, UUID moduleId);
}
