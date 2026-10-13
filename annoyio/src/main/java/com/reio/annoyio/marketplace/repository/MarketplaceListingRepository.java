package com.reio.annoyio.marketplace.repository;

import com.reio.annoyio.marketplace.entity.MarketplaceListing;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketplaceListingRepository extends JpaRepository<MarketplaceListing, Long> {
}
