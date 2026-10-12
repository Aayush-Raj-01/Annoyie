package com.reio.annoyio.marketplace.repository;


import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import com.reio.annoyio.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MarketplaceProfileRepository extends JpaRepository<MarketplaceProfile,Long> {
    Optional<MarketplaceProfile> findByUser(User user);
    Optional<MarketplaceProfile> findByUserId(Long userId);
    boolean existsByDisplayName(String displayName);
    boolean existsByDisplayNameAndIdNot(String displayName, Long id);
}

