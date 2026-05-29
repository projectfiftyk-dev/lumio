package com.lumio.api.persistence;

import com.lumio.api.domain.LumioPath;
import com.lumio.api.enums.ContentStatus;
import com.lumio.api.enums.Vertical;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface PathRepository extends JpaRepository<LumioPath, UUID> {

    @Query(value = "SELECT * FROM paths WHERE " +
           "(:search IS NULL OR lower(title) LIKE lower(concat('%', :search, '%')) " +
           "OR lower(description) LIKE lower(concat('%', :search, '%'))) " +
           "AND (:vertical IS NULL OR vertical = :vertical) " +
           "AND (:status IS NULL OR status = :status)",
           nativeQuery = true)
    List<LumioPath> findAllWithFilters(
            @Param("search") String search,
            @Param("vertical") String vertical,
            @Param("status") String status);
}
