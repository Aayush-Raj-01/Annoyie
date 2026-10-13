package com.reio.annoyio.marketplace.dto;

public record CreateMarketplaceProfileRequest(String displayName, String bio, String phoneNumber, String profileImage) {
    public CreateMarketplaceProfileRequest(String displayName, String bio, String phoneNumber) {
        this(displayName, bio, phoneNumber, null);
    }
}

