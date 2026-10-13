package com.reio.annoyio.marketplace.dto;

public record SendMarketplaceMessageRequest(
        Long senderProfileId,
        Long receiverProfileId,
        Long listingId,
        String content
) {
}
