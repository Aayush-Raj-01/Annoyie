package com.reio.annoyio.marketplace.dto;

public record MarketplaceMessageResponse(
        Long id,
        Long senderProfileId,
        String senderDisplayName,
        String senderProfileImage,
        Long receiverProfileId,
        String receiverDisplayName,
        String receiverProfileImage,
        Long listingId,
        String listingTitle,
        Double listingPrice,
        String content,
        String createdAt,
        boolean isRead
) {
}
