package com.reio.annoyio.marketplace.repository;

import com.reio.annoyio.marketplace.entity.MarketplaceListing;
import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, Long> {
    List<MarketplaceListing> findAllByOrderByCreatedAtDesc();
    List<MarketplaceListing> findBySellerOrderByCreatedAtDesc(MarketplaceProfile seller);
    List<MarketplaceListing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
}
