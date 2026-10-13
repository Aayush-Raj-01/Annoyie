package com.reio.annoyio.marketplace.dto;

public record MarketplaceBlockedProfileResponse(
        Long blockId,
        Long blockedProfileId,
        String displayName,
        String profileImage,
        String blockedAt
) {
}
