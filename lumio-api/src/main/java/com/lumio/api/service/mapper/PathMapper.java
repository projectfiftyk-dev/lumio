package com.lumio.api.service.mapper;

import com.lumio.api.domain.LumioPath;
import com.lumio.api.service.StorageService;
import com.lumio.api.transfer.PathRequest;
import com.lumio.api.transfer.PathResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class PathMapper {

    private final StorageService storageService;

    public PathResponse toResponse(LumioPath path) {
        String key = path.getThumbnail();
        return new PathResponse(
                path.getId(),
                path.getTitle(),
                path.getDescription(),
                path.getVertical(),
                key,
                toPresignedUrl(key),
                path.getTheme(),
                path.getStatus(),
                path.getMetadata(),
                path.getCreatedAt(),
                path.getUpdatedAt()
        );
    }

    public LumioPath toDomain(PathRequest request) {
        return LumioPath.builder()
                .title(request.title())
                .description(request.description())
                .vertical(request.vertical())
                .thumbnail(request.thumbnail())
                .theme(request.theme())
                .status(request.status())
                .metadata(request.metadata())
                .build();
    }

    public void applyUpdate(LumioPath path, PathRequest request) {
        path.setTitle(request.title());
        path.setDescription(request.description());
        path.setVertical(request.vertical());
        path.setThumbnail(request.thumbnail());
        path.setTheme(request.theme());
        path.setStatus(request.status());
        path.setMetadata(request.metadata());
    }

    private String toPresignedUrl(String key) {
        return key != null ? storageService.getPresignedUrl(key) : null;
    }
}
