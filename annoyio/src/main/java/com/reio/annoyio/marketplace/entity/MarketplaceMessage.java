package com.reio.annoyio.marketplace.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "marketplace_messages")
public class MarketplaceMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_profile_id", nullable = false)
    private MarketplaceProfile sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "receiver_profile_id", nullable = false)
    private MarketplaceProfile receiver;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "listing_id")
    private MarketplaceListing listing;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private LocalDateTime createdAt;

    private boolean isRead;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public MarketplaceProfile getSender() {
        return sender;
    }

    public void setSender(MarketplaceProfile sender) {
        this.sender = sender;
    }

    public MarketplaceProfile getReceiver() {
        return receiver;
    }

    public void setReceiver(MarketplaceProfile receiver) {
        this.receiver = receiver;
    }

    public MarketplaceListing getListing() {
        return listing;
    }

    public void setListing(MarketplaceListing listing) {
        this.listing = listing;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }
}
