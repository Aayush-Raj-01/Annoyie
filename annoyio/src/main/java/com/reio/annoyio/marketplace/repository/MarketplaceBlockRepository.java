package com.reio.annoyio.marketplace.repository;

import com.reio.annoyio.marketplace.entity.MarketplaceBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketplaceBlockRepository extends JpaRepository<MarketplaceBlock, Long> {

    boolean existsByBlockerProfileIdAndBlockedProfileId(Long blockerProfileId, Long blockedProfileId);

    Optional<MarketplaceBlock> findByBlockerProfileIdAndBlockedProfileId(Long blockerProfileId, Long blockedProfileId);

    @Transactional
    @Modifying
    void deleteByBlockerProfileIdAndBlockedProfileId(Long blockerProfileId, Long blockedProfileId);

    List<MarketplaceBlock> findByBlockerProfileIdOrderByCreatedAtDesc(Long blockerProfileId);

    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN TRUE ELSE FALSE END FROM MarketplaceBlock b " +
            "WHERE (b.blockerProfile.id = :p1 AND b.blockedProfile.id = :p2) " +
            "   OR (b.blockerProfile.id = :p2 AND b.blockedProfile.id = :p1)")
    boolean isBlockedEitherWay(@Param("p1") Long profileId1, @Param("p2") Long profileId2);
}
