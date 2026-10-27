package com.reio.annoyio.marketplace.controller;


import com.reio.annoyio.marketplace.dto.CreateMarketplaceProfileRequest;
import com.reio.annoyio.marketplace.dto.MarketplaceProfileResponse;
import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import com.reio.annoyio.marketplace.service.MarketplaceProfileService;
import com.reio.annoyio.security.CurrentUser;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/marketplace/profile")
public class MarketplaceProfileController {

    private final MarketplaceProfileService service;
    private final CurrentUser currentUser;

    public MarketplaceProfileController(MarketplaceProfileService service, CurrentUser currentUser){
        this.service = service;
        this.currentUser = currentUser;
    }

    @PostMapping("/{userId}")
    public org.springframework.http.ResponseEntity<?> createProfile(@PathVariable Long userId, @RequestBody CreateMarketplaceProfileRequest request){
        currentUser.requireUserId(userId);
        try {
            return org.springframework.http.ResponseEntity.ok(service.createProfile(userId, request));
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{userId}")
    public org.springframework.http.ResponseEntity<?> getProfile(@PathVariable Long userId){
        currentUser.requireUserId(userId);
        try {
            return org.springframework.http.ResponseEntity.ok(service.getProfileByUserId(userId));
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.status(404).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public org.springframework.http.ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody CreateMarketplaceProfileRequest request){
        currentUser.requireUserId(userId);
        try {
            return org.springframework.http.ResponseEntity.ok(service.updateProfile(userId, request));
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/view/{profileId}")
    public org.springframework.http.ResponseEntity<?> getProfileById(@PathVariable Long profileId){
        try {
            return org.springframework.http.ResponseEntity.ok(service.getProfileById(profileId));
        } catch (RuntimeException e) {
            return org.springframework.http.ResponseEntity.status(404).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/check-name")
    public org.springframework.http.ResponseEntity<?> checkDisplayName(@RequestParam String name){
        boolean available = service.isDisplayNameAvailable(name);
        return org.springframework.http.ResponseEntity.ok(java.util.Map.of("available", available));
    }
}

