package com.reio.annoyio.marketplace.dto;

public record MarketplaceBlockStatusResponse(
        boolean isBlockedByMe,
        boolean isBlockedByThem,
        boolean isBlockedEitherWay
) {
}
