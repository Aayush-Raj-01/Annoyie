package com.reio.annoyio.gallery.controller;

import com.reio.annoyio.gallery.dto.GalleryPostResponse;
import com.reio.annoyio.gallery.service.GalleryService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/gallery")
public class GalleryController {

    private final GalleryService galleryService;
    private final SimpMessagingTemplate messagingTemplate;

    public GalleryController(GalleryService galleryService, SimpMessagingTemplate messagingTemplate) {
        this.galleryService = galleryService;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Get latest but randomized photos for the home gallery feed.
     */
    @GetMapping
    public List<GalleryPostResponse> getRandomLatestFeed(
            @RequestParam(required = false, defaultValue = "36") Integer limit
    ) {
        return galleryService.getRandomLatestPosts(limit);
    }

    /**
     * Get latest photos in strictly chronological order.
     */
    @GetMapping("/latest")
    public List<GalleryPostResponse> getLatestFeed() {
        return galleryService.getLatestPosts();
    }

    /**
     * Upload a new photo to the gallery and broadcast real-time update to all clients.
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<GalleryPostResponse> uploadPhoto(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "username", required = false) String username
    ) {
        GalleryPostResponse response = galleryService.uploadPost(file, caption, email, username);
        try {
            messagingTemplate.convertAndSend("/topic/gallery", response);
        } catch (Exception ex) {
            System.err.println("Notice: Could not broadcast gallery post over WebSocket: " + ex.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    /**
     * Delete a gallery photo and broadcast deletion event to all clients.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePhoto(
            @PathVariable Long id,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "username", required = false) String username
    ) {
        boolean deleted = galleryService.deletePost(id, email, username);
        if (deleted) {
            try {
                messagingTemplate.convertAndSend("/topic/gallery/delete", (Object) Map.of("id", id));
            } catch (Exception ex) {
                System.err.println("Notice: Could not broadcast gallery deletion: " + ex.getMessage());
            }
            return ResponseEntity.ok(Map.of("message", "Photo deleted successfully"));
        } else {
            return ResponseEntity.notFound().build();
        }
    }
}
