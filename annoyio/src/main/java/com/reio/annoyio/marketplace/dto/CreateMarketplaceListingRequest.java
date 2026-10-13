package com.reio.annoyio.marketplace.dto;

import java.util.List;

public record CreateMarketplaceListingRequest(
        String title,
        String description,
        Double price,
        String category,
        String imageUrl,
        List<String> mediaUrls,
        Boolean bargainAvailable,
        String hostelName,
        String roomNo
) {
    public CreateMarketplaceListingRequest(
            String title,
            String description,
            Double price,
            String category,
            String imageUrl,
            Boolean bargainAvailable,
            String hostelName,
            String roomNo
    ) {
        this(title, description, price, category, imageUrl, null, bargainAvailable, hostelName, roomNo);
    }
}
