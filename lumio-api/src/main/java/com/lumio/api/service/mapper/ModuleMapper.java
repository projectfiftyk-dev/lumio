package com.lumio.api.service.mapper;

import com.lumio.api.domain.LumioModule;
import com.lumio.api.service.StorageService;
import com.lumio.api.transfer.ModuleRequest;
import com.lumio.api.transfer.ModuleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ModuleMapper {

    private final StorageService storageService;

    public ModuleResponse toResponse(LumioModule module) {
        String key = module.getThumbnail();
        return new ModuleResponse(
                module.getId(),
                module.getPath().getId(),
                module.getTitle(),
                module.getDescription(),
                key,
                toPresignedUrl(key),
                module.getOrderIndex(),
                module.getStatus(),
                module.getCreatedAt(),
                module.getUpdatedAt()
        );
    }

    public void applyUpdate(LumioModule module, ModuleRequest request) {
        module.setTitle(request.title());
        module.setDescription(request.description());
        module.setThumbnail(request.thumbnail());
        module.setOrderIndex(request.orderIndex());
        module.setStatus(request.status());
    }

    private String toPresignedUrl(String key) {
        return key != null ? storageService.getPresignedUrl(key) : null;
    }
}
