package com.lumio.api.web;

import com.lumio.api.service.StorageService;
import com.lumio.api.transfer.MediaUploadResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/media")
@RequiredArgsConstructor
@Tag(name = "Media", description = "File upload")
public class MediaController {

    private final StorageService storageService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Upload a thumbnail image",
               description = "Stores the image in MinIO and returns the object key plus a presigned URL valid for 7 days. Pass the key as the `thumbnail` field when creating or updating a path or module.")
    MediaUploadResponse upload(@RequestParam("file") MultipartFile file) {
        String key = storageService.upload(file);
        String url = storageService.getPresignedUrl(key);
        return new MediaUploadResponse(key, url);
    }
}
