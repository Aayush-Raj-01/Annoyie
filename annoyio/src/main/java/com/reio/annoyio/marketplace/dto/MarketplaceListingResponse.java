package com.reio.annoyio.marketplace.dto;

import java.util.List;

public record MarketplaceListingResponse(
        Long id,
        String title,
        String description,
        Double price,
        String category,
        String imageUrl,
        List<String> mediaUrls,
        String createdAt,
        Long sellerProfileId,
        String sellerDisplayName,
        String sellerProfileImage,
        String sellerPhoneNumber,
        Long sellerUserId,
        Boolean bargainAvailable,
        String hostelName,
        String roomNo
) {
}
