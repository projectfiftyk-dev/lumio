package com.lumio.api.service;

import com.lumio.api.exception.StorageException;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.presigned-url-expiry-days:7}")
    private int presignedUrlExpiryDays;

    public String upload(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files are allowed (received: " + contentType + ")");
        }

        String key = buildKey(file.getOriginalFilename());

        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(is, file.getSize(), -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to upload file to storage", e);
        }

        LOGGER.info("Uploaded {} ({} bytes)", key, file.getSize());
        return key;
    }

    public String getPresignedUrl(String objectKey) {
        return getPresignedUrl(objectKey, presignedUrlExpiryDays, TimeUnit.DAYS);
    }

    public String getPresignedUrl(String objectKey, int duration, TimeUnit unit) {
        try {
            return minioClient.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .method(Method.GET)
                    .expiry(duration, unit)
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to generate presigned URL for " + objectKey, e);
        }
    }

    public String getContent(String objectKey) {
        try (InputStream is = minioClient.getObject(GetObjectArgs.builder()
                .bucket(bucket)
                .object(objectKey)
                .build())) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new StorageException("Failed to read object: " + objectKey, e);
        }
    }

    public void delete(String objectKey) {
        try {
            minioClient.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .build());
            LOGGER.info("Deleted {}", objectKey);
        } catch (Exception e) {
            LOGGER.warn("Failed to delete object {}: {}", objectKey, e.getMessage());
        }
    }

    public String uploadYaml(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType != null
                && !contentType.contains("yaml")
                && !contentType.contains("text/")
                && !contentType.equals("application/octet-stream")) {
            throw new IllegalArgumentException("Expected a YAML file (received: " + contentType + ")");
        }

        String key = "books/" + UUID.randomUUID() + ".yaml";
        try (InputStream is = file.getInputStream()) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(is, file.getSize(), -1)
                    .contentType("application/x-yaml")
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to upload YAML to storage", e);
        }

        LOGGER.info("Uploaded YAML {} ({} bytes)", key, file.getSize());
        return key;
    }

    public String uploadYamlForBook(UUID bookId, String content) {
        String key = "books/" + bookId + "/book.yaml";
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        try (InputStream is = new ByteArrayInputStream(bytes)) {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(is, bytes.length, -1)
                    .contentType("application/x-yaml")
                    .build());
        } catch (Exception e) {
            throw new StorageException("Failed to upload YAML for book " + bookId, e);
        }
        LOGGER.info("Uploaded YAML for book {}", bookId);
        return key;
    }

    private String buildKey(String originalFilename) {
        String ext = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            ext = "." + originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
        }
        return "thumbnails/" + UUID.randomUUID() + ext;
    }
}
