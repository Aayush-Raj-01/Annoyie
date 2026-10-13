package com.reio.annoyio.marketplace.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "marketplace_blocks",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"blocker_profile_id", "blocked_profile_id"})
    }
)
public class MarketplaceBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "blocker_profile_id", nullable = false)
    private MarketplaceProfile blockerProfile;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "blocked_profile_id", nullable = false)
    private MarketplaceProfile blockedProfile;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public MarketplaceBlock() {
    }

    public MarketplaceBlock(MarketplaceProfile blockerProfile, MarketplaceProfile blockedProfile) {
        this.blockerProfile = blockerProfile;
        this.blockedProfile = blockedProfile;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public MarketplaceProfile getBlockerProfile() {
        return blockerProfile;
    }

    public void setBlockerProfile(MarketplaceProfile blockerProfile) {
        this.blockerProfile = blockerProfile;
    }

    public MarketplaceProfile getBlockedProfile() {
        return blockedProfile;
    }

    public void setBlockedProfile(MarketplaceProfile blockedProfile) {
        this.blockedProfile = blockedProfile;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
