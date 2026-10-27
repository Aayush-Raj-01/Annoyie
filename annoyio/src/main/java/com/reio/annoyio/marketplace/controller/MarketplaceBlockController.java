package com.reio.annoyio.marketplace.controller;

import com.reio.annoyio.marketplace.dto.MarketplaceBlockStatusResponse;
import com.reio.annoyio.marketplace.dto.MarketplaceBlockedProfileResponse;
import com.reio.annoyio.marketplace.service.MarketplaceBlockService;
import com.reio.annoyio.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/marketplace/blocks")
public class MarketplaceBlockController {

    private final MarketplaceBlockService blockService;
    private final CurrentUser currentUser;

    public MarketplaceBlockController(MarketplaceBlockService blockService, CurrentUser currentUser) {
        this.blockService = blockService;
        this.currentUser = currentUser;
    }

    @PostMapping("/{blockerProfileId}/{targetProfileId}")
    public ResponseEntity<?> blockProfile(
            @PathVariable Long blockerProfileId,
            @PathVariable Long targetProfileId
    ) {
        currentUser.requireMarketplaceProfileId(blockerProfileId);
        try {
            MarketplaceBlockedProfileResponse res = blockService.blockProfile(blockerProfileId, targetProfileId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{blockerProfileId}/{targetProfileId}")
    public ResponseEntity<?> unblockProfile(
            @PathVariable Long blockerProfileId,
            @PathVariable Long targetProfileId
    ) {
        currentUser.requireMarketplaceProfileId(blockerProfileId);
        try {
            blockService.unblockProfile(blockerProfileId, targetProfileId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Profile unblocked successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{profileId}")
    public ResponseEntity<List<MarketplaceBlockedProfileResponse>> getBlockedProfiles(@PathVariable Long profileId) {
        currentUser.requireMarketplaceProfileId(profileId);
        return ResponseEntity.ok(blockService.getBlockedProfiles(profileId));
    }

    @GetMapping("/status/{myProfileId}/{targetProfileId}")
    public ResponseEntity<MarketplaceBlockStatusResponse> getBlockStatus(
            @PathVariable Long myProfileId,
            @PathVariable Long targetProfileId
    ) {
        currentUser.requireMarketplaceProfileId(myProfileId);
        return ResponseEntity.ok(blockService.getBlockStatus(myProfileId, targetProfileId));
    }

    // User-ID based routes
    @PostMapping("/user/{userId}/{targetProfileId}")
    public ResponseEntity<?> blockByUserId(
            @PathVariable Long userId,
            @PathVariable Long targetProfileId
    ) {
        currentUser.requireUserId(userId);
        try {
            MarketplaceBlockedProfileResponse res = blockService.blockByUserId(userId, targetProfileId);
            return ResponseEntity.ok(res);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/user/{userId}/{targetProfileId}")
    public ResponseEntity<?> unblockByUserId(
            @PathVariable Long userId,
            @PathVariable Long targetProfileId
    ) {
        currentUser.requireUserId(userId);
        try {
            blockService.unblockByUserId(userId, targetProfileId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Profile unblocked successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<MarketplaceBlockedProfileResponse>> getBlockedProfilesByUserId(@PathVariable Long userId) {
        currentUser.requireUserId(userId);
        return ResponseEntity.ok(blockService.getBlockedProfilesByUserId(userId));
    }

    @GetMapping("/user-status/{userId}/{targetProfileId}")
    public ResponseEntity<MarketplaceBlockStatusResponse> getBlockStatusByUserId(
            @PathVariable Long userId,
            @PathVariable Long targetProfileId
    ) {
        currentUser.requireUserId(userId);
        return ResponseEntity.ok(blockService.getBlockStatusByUserId(userId, targetProfileId));
    }
}
