package com.reio.annoyio.marketplace.service;

import com.cloudinary.Cloudinary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class MarketplaceMediaService {

    private final Cloudinary cloudinary;

    @Autowired
    public MarketplaceMediaService(@Autowired(required = false) Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public Map<String, String> uploadMedia(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > 60 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be under 60MB");
        }

        String contentType = file.getContentType();
        boolean isVideo = contentType != null && contentType.startsWith("video/");
        boolean isImage = contentType != null && contentType.startsWith("image/");

        if (!isImage && !isVideo) {
            throw new IllegalArgumentException("Only image or video files are allowed (PNG, JPG, WEBP, MP4, MOV, WEBM)");
        }

        String mediaType = isVideo ? "video" : "image";
        String mediaUrl = null;

        // Try Cloudinary if available
        if (cloudinary != null) {
            try {
                Map<String, Object> params = new HashMap<>();
                params.put("resource_type", isVideo ? "video" : "image");
                params.put("folder", "annoyms_marketplace");

                @SuppressWarnings("unchecked")
                Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
                if (uploadResult != null) {
                    mediaUrl = (String) uploadResult.get("secure_url");
                    if (mediaUrl == null) {
                        mediaUrl = (String) uploadResult.get("url");
                    }
                }
            } catch (Exception ex) {
                System.err.println("Cloudinary upload failed, using local storage: " + ex.getMessage());
            }
        }

        // Local storage fallback
        if (mediaUrl == null) {
            try {
                String originalName = file.getOriginalFilename();
                String ext = isVideo ? ".mp4" : ".jpg";
                if (originalName != null && originalName.contains(".")) {
                    ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
                }

                String filename = UUID.randomUUID().toString() + ext;
                Path uploadDir = Paths.get("uploads", "marketplace");
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }

                Path targetPath = uploadDir.resolve(filename);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                mediaUrl = "http://localhost:8080/uploads/marketplace/" + filename;
            } catch (IOException e) {
                throw new RuntimeException("Failed to save media file: " + e.getMessage(), e);
            }
        }

        return Map.of("url", mediaUrl, "type", mediaType);
    }
}
