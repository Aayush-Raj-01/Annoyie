package com.reio.annoyio.marketplace.repository;

import com.reio.annoyio.marketplace.entity.MarketplaceMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface MarketplaceMessageRepository extends JpaRepository<MarketplaceMessage, Long> {

    @Query("SELECT m FROM MarketplaceMessage m WHERE " +
            "(m.sender.id = :profile1Id AND m.receiver.id = :profile2Id) OR " +
            "(m.sender.id = :profile2Id AND m.receiver.id = :profile1Id) " +
            "ORDER BY m.createdAt ASC")
    List<MarketplaceMessage> findConversation(
            @Param("profile1Id") Long profile1Id,
            @Param("profile2Id") Long profile2Id
    );

    @Query("SELECT m FROM MarketplaceMessage m WHERE " +
            "m.sender.id = :profileId OR m.receiver.id = :profileId " +
            "ORDER BY m.createdAt DESC")
    List<MarketplaceMessage> findRecentForProfile(@Param("profileId") Long profileId);

    @Transactional
    @Modifying
    @Query("UPDATE MarketplaceMessage m SET m.isRead = true WHERE " +
            "m.receiver.id = :myProfileId AND m.sender.id = :otherProfileId AND m.isRead = false")
    void markConversationAsRead(
            @Param("myProfileId") Long myProfileId,
            @Param("otherProfileId") Long otherProfileId
    );

    @Query("SELECT COUNT(m) FROM MarketplaceMessage m WHERE m.receiver.id = :profileId AND m.isRead = false")
    long countUnreadMessages(@Param("profileId") Long profileId);

    @Transactional
    @Modifying
    @Query("UPDATE MarketplaceMessage m SET m.listing = null WHERE m.listing.id = :listingId")
    void detachListingFromMessages(@Param("listingId") Long listingId);
}
