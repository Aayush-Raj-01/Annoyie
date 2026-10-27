package com.reio.annoyio.marketplace.controller;

import com.reio.annoyio.marketplace.dto.CreateMarketplaceListingRequest;
import com.reio.annoyio.marketplace.service.MarketplaceListingService;
import com.reio.annoyio.marketplace.service.MarketplaceMediaService;
import com.reio.annoyio.security.CurrentUser;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/marketplace/listings")
public class MarketplaceListingController {

    private final MarketplaceListingService service;
    private final MarketplaceMediaService mediaService;
    private final CurrentUser currentUser;

    public MarketplaceListingController(
            MarketplaceListingService service,
            MarketplaceMediaService mediaService,
            CurrentUser currentUser
    ) {
        this.service = service;
        this.mediaService = mediaService;
        this.currentUser = currentUser;
    }

    @PostMapping(value = "/upload-media", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadMedia(@RequestParam("file") MultipartFile file) {
        currentUser.get();
        try {
            return ResponseEntity.ok(mediaService.uploadMedia(file));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{userId}")
    public ResponseEntity<?> createListing(
            @PathVariable Long userId,
            @RequestBody CreateMarketplaceListingRequest request
    ) {
        currentUser.requireUserId(userId);
        try {
            return ResponseEntity.ok(service.createListing(userId, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllListings() {
        return ResponseEntity.ok(service.getAllListings());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getListingsByUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(service.getListingsByUserId(userId));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/seller/{sellerProfileId}")
    public ResponseEntity<?> getListingsBySeller(@PathVariable Long sellerProfileId) {
        return ResponseEntity.ok(service.getListingsBySellerProfileId(sellerProfileId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getListingById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.getListingById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteListing(
            @PathVariable Long id
    ) {
        Long resolvedUserId = currentUser.get().getId();
        try {
            service.deleteListing(id, resolvedUserId);
            return ResponseEntity.ok(Map.of("message", "Listing deleted successfully", "id", id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
