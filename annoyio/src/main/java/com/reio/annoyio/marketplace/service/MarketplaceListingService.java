package com.reio.annoyio.marketplace.service;

import com.reio.annoyio.marketplace.dto.CreateMarketplaceListingRequest;
import com.reio.annoyio.marketplace.dto.MarketplaceListingResponse;
import com.reio.annoyio.marketplace.entity.MarketplaceListing;
import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import com.reio.annoyio.marketplace.repository.MarketplaceListingRepository;
import com.reio.annoyio.marketplace.repository.MarketplaceProfileRepository;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import com.reio.annoyio.marketplace.repository.MarketplaceMessageRepository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MarketplaceListingService {

    private final MarketplaceListingRepository listingRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final MarketplaceMessageRepository messageRepository;

    public MarketplaceListingService(
            MarketplaceListingRepository listingRepository,
            MarketplaceProfileRepository profileRepository,
            UserRepository userRepository,
            MarketplaceMessageRepository messageRepository
    ) {
        this.listingRepository = listingRepository;
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.messageRepository = messageRepository;
    }

    public MarketplaceListingResponse createListing(Long userId, CreateMarketplaceListingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        MarketplaceProfile seller = profileRepository.findByUserId(userId)
                .or(() -> profileRepository.findByUser(user))
                .orElseThrow(() -> new RuntimeException("Marketplace seller profile not found. Please create a seller profile first."));

        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.price() == null || request.price() < 0) {
            throw new IllegalArgumentException("Valid price is required");
        }
        if (request.hostelName() == null || request.hostelName().trim().isEmpty()) {
            throw new IllegalArgumentException("Hostel name is mandatory");
        }
        if (request.roomNo() == null || request.roomNo().trim().isEmpty()) {
            throw new IllegalArgumentException("Room number is mandatory");
        }

        List<String> incomingMedia = request.mediaUrls();
        if (incomingMedia != null && incomingMedia.size() > 6) {
            throw new IllegalArgumentException("Maximum 6 photos or videos can be uploaded");
        }

        String primaryImageUrl = request.imageUrl();
        String combinedMediaUrls = null;

        if (incomingMedia != null && !incomingMedia.isEmpty()) {
            combinedMediaUrls = String.join(",", incomingMedia);
            if (primaryImageUrl == null || primaryImageUrl.isBlank()) {
                primaryImageUrl = incomingMedia.get(0);
            }
        } else if (primaryImageUrl != null && !primaryImageUrl.isBlank()) {
            combinedMediaUrls = primaryImageUrl.trim();
        }

        MarketplaceListing listing = new MarketplaceListing();
        listing.setTitle(request.title().trim());
        listing.setDescription(request.description() != null ? request.description().trim() : "");
        listing.setPrice(request.price());
        listing.setCategory(request.category() != null && !request.category().isBlank() ? request.category().trim() : "Other");
        listing.setImageUrl(primaryImageUrl != null && !primaryImageUrl.isBlank() ? primaryImageUrl.trim() : null);
        listing.setMediaUrls(combinedMediaUrls);
        listing.setBargainAvailable(request.bargainAvailable() != null ? request.bargainAvailable() : false);
        listing.setHostelName(request.hostelName().trim());
        listing.setRoomNo(request.roomNo().trim());
        listing.setCreatedAt(LocalDateTime.now());
        listing.setSeller(seller);

        MarketplaceListing saved = listingRepository.save(listing);
        return mapToResponse(saved);
    }

    public List<MarketplaceListingResponse> getAllListings() {
        return listingRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MarketplaceListingResponse> getListingsBySellerProfileId(Long profileId) {
        return listingRepository.findBySellerIdOrderByCreatedAtDesc(profileId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MarketplaceListingResponse> getListingsByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .or(() -> profileRepository.findByUser(user))
                .orElse(null);
        if (profile == null) {
            return Collections.emptyList();
        }
        return getListingsBySellerProfileId(profile.getId());
    }

    public MarketplaceListingResponse getListingById(Long id) {
        MarketplaceListing listing = listingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Listing not found"));
        return mapToResponse(listing);
    }

    @Transactional
    public void deleteListing(Long listingId, Long userId) {
        MarketplaceListing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> new RuntimeException("Listing not found"));

        if (userId != null && listing.getSeller() != null) {
            Long sellerUserId = listing.getSeller().getUser() != null ? listing.getSeller().getUser().getId() : null;
            Long sellerProfileId = listing.getSeller().getId();

            boolean isOwner = (sellerUserId != null && sellerUserId.equals(userId))
                    || (sellerProfileId != null && sellerProfileId.equals(userId));

            if (!isOwner) {
                throw new RuntimeException("You are not authorized to delete this listing");
            }
        }

        // Cleanly decouple any messages that reference this listing first
        messageRepository.detachListingFromMessages(listingId);

        // Delete the listing
        listingRepository.delete(listing);
    }

    private MarketplaceListingResponse mapToResponse(MarketplaceListing listing) {
        MarketplaceProfile seller = listing.getSeller();
        Long sellerProfileId = seller != null ? seller.getId() : null;
        String sellerDisplayName = seller != null ? seller.getDisplayName() : "Campus Seller";
        String sellerProfileImage = seller != null ? seller.getProfileImage() : null;
        String sellerPhoneNumber = seller != null ? seller.getPhoneNumber() : null;
        Long sellerUserId = (seller != null && seller.getUser() != null) ? seller.getUser().getId() : null;

        List<String> mediaList = new ArrayList<>();
        if (listing.getMediaUrls() != null && !listing.getMediaUrls().isBlank()) {
            String[] parts = listing.getMediaUrls().split(",");
            for (String p : parts) {
                if (!p.trim().isEmpty()) {
                    mediaList.add(p.trim());
                }
            }
        } else if (listing.getImageUrl() != null && !listing.getImageUrl().isBlank()) {
            mediaList.add(listing.getImageUrl().trim());
        }

        return new MarketplaceListingResponse(
                listing.getId(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPrice(),
                listing.getCategory(),
                listing.getImageUrl(),
                mediaList,
                listing.getCreatedAt() != null ? listing.getCreatedAt().toString() : LocalDateTime.now().toString(),
                sellerProfileId,
                sellerDisplayName,
                sellerProfileImage,
                sellerPhoneNumber,
                sellerUserId,
                listing.getBargainAvailable() != null ? listing.getBargainAvailable() : false,
                listing.getHostelName(),
                listing.getRoomNo()
        );
    }
}
