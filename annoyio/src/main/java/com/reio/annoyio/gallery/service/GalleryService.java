package com.reio.annoyio.gallery.service;

import com.cloudinary.Cloudinary;
import com.reio.annoyio.gallery.dto.GalleryPostResponse;
import com.reio.annoyio.gallery.entity.GalleryPost;
import com.reio.annoyio.gallery.repository.GalleryRepository;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class GalleryService {

    private final GalleryRepository galleryRepository;
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;

    @Autowired
    public GalleryService(GalleryRepository galleryRepository,
                          UserRepository userRepository,
                          @Autowired(required = false) Cloudinary cloudinary) {
        this.galleryRepository = galleryRepository;
        this.userRepository = userRepository;
        this.cloudinary = cloudinary;
    }

    @Transactional
    public GalleryPostResponse uploadPost(MultipartFile file, String caption, String email, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Photo file cannot be empty");
        }

        // 1. Resolve uploader user if provided
        User uploader = null;
        if (email != null && !email.isBlank()) {
            uploader = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        }
        if (uploader == null && username != null && !username.isBlank()) {
            uploader = userRepository.findByUsername(username.trim()).orElse(null);
        }

        String mediaUrl = null;
        String publicId = null;
        String mediaType = "image";

        // 2. Try uploading to Cloudinary
        if (cloudinary != null) {
            try {
                Map<String, Object> params = new HashMap<>();
                params.put("resource_type", "auto");
                params.put("folder", "annoyms_gallery");

                @SuppressWarnings("unchecked")
                Map<String, Object> uploadResult = cloudinary.uploader().upload(file.getBytes(), params);
                if (uploadResult != null) {
                    mediaUrl = (String) uploadResult.get("secure_url");
                    if (mediaUrl == null) {
                        mediaUrl = (String) uploadResult.get("url");
                    }
                    publicId = (String) uploadResult.get("public_id");
                    String rType = (String) uploadResult.get("resource_type");
                    if (rType != null) {
                        mediaType = rType;
                    }
                }
            } catch (Exception ex) {
                System.err.println("Cloudinary upload failed, falling back to local storage: " + ex.getMessage());
            }
        }

        // 3. Fallback to local file storage if Cloudinary didn't provide a URL
        if (mediaUrl == null) {
            try {
                String originalName = file.getOriginalFilename();
                String ext = ".jpg";
                if (originalName != null && originalName.contains(".")) {
                    ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
                }

                String filename = UUID.randomUUID().toString() + ext;
                Path uploadDir = Paths.get("uploads", "gallery");
                if (!Files.exists(uploadDir)) {
                    Files.createDirectories(uploadDir);
                }

                Path targetPath = uploadDir.resolve(filename);
                Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

                mediaUrl = "http://localhost:8080/uploads/gallery/" + filename;
                publicId = filename;
            } catch (IOException ioException) {
                throw new RuntimeException("Failed to store gallery media: " + ioException.getMessage(), ioException);
            }
        }

        // 4. Persist GalleryPost record
        GalleryPost post = new GalleryPost();
        post.setMediaUrl(mediaUrl);
        post.setPublicId(publicId != null ? publicId : "gal_" + System.currentTimeMillis());
        post.setMediaType(mediaType);
        post.setCaption(caption != null && !caption.isBlank() ? caption.trim() : null);
        post.setCreatedAt(LocalDateTime.now());
        post.setUploadedBy(uploader);

        GalleryPost saved = galleryRepository.save(post);
        return mapToResponse(saved);
    }

    public List<GalleryPostResponse> getRandomLatestPosts(Integer limit) {
        List<GalleryPost> latest = galleryRepository.findTop100ByOrderByCreatedAtDesc();
        if (latest.isEmpty()) {
            return Collections.emptyList();
        }

        List<GalleryPost> shuffled = new ArrayList<>(latest);
        Collections.shuffle(shuffled);

        int targetLimit = (limit != null && limit > 0) ? limit : 36;
        if (shuffled.size() > targetLimit) {
            shuffled = shuffled.subList(0, targetLimit);
        }

        return shuffled.stream().map(this::mapToResponse).toList();
    }

    public List<GalleryPostResponse> getLatestPosts() {
        return galleryRepository.findTop100ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Transactional
    public boolean deletePost(Long id, String email, String username) {
        Optional<GalleryPost> optionalPost = galleryRepository.findById(id);
        if (optionalPost.isEmpty()) {
            return false;
        }

        GalleryPost post = optionalPost.get();
        // If post has an uploader, check ownership
        if (post.getUploadedBy() != null) {
            boolean matchesEmail = email != null && email.equalsIgnoreCase(post.getUploadedBy().getEmail());
            boolean matchesUsername = username != null && username.equalsIgnoreCase(post.getUploadedBy().getUsername());
            if (!matchesEmail && !matchesUsername) {
                throw new RuntimeException("You are not authorized to delete this photo");
            }
        }

        galleryRepository.delete(post);
        return true;
    }

    private GalleryPostResponse mapToResponse(GalleryPost post) {
        Long uploaderId = null;
        String uploaderUsername = "Anonymous";
        String uploaderAvatarUrl = null;
        String uploaderTag = null;

        if (post.getUploadedBy() != null) {
            uploaderId = post.getUploadedBy().getId();
            uploaderUsername = post.getUploadedBy().getUsername() != null
                    ? post.getUploadedBy().getUsername()
                    : (post.getUploadedBy().getName() != null ? post.getUploadedBy().getName() : "Anonymous");
            uploaderAvatarUrl = post.getUploadedBy().getAvatarUrl();
            uploaderTag = post.getUploadedBy().getTag();
        }

        return new GalleryPostResponse(
                post.getId(),
                post.getMediaUrl(),
                post.getMediaType(),
                post.getCaption(),
                post.getCreatedAt(),
                uploaderId,
                uploaderUsername,
                uploaderAvatarUrl,
                uploaderTag
        );
    }
}
