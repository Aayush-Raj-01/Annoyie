package com.reio.annoyio.marketplace.dto;

public record MarketplaceThreadResponse(
        Long otherProfileId,
        String otherDisplayName,
        String otherProfileImage,
        Long listingId,
        String listingTitle,
        Double listingPrice,
        String lastMessage,
        String lastMessageAt,
        int unreadCount
) {
}
