package com.reio.annoyio.marketplace.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "marketplace_listings")
public class MarketplaceListing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Double price;

    private String category;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String mediaUrls;

    private LocalDateTime createdAt;

    private Boolean bargainAvailable = false;

    private String hostelName;

    private String roomNo;

    @ManyToOne
    @JoinColumn(name = "seller_id")
    private MarketplaceProfile seller;

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getMediaUrls() {
        return mediaUrls != null ? mediaUrls : (imageUrl != null ? imageUrl : "");
    }

    public void setMediaUrls(String mediaUrls) {
        this.mediaUrls = mediaUrls;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getBargainAvailable() {
        return bargainAvailable != null ? bargainAvailable : false;
    }

    public void setBargainAvailable(Boolean bargainAvailable) {
        this.bargainAvailable = bargainAvailable;
    }

    public String getHostelName() {
        return hostelName;
    }

    public void setHostelName(String hostelName) {
        this.hostelName = hostelName;
    }

    public String getRoomNo() {
        return roomNo;
    }

    public void setRoomNo(String roomNo) {
        this.roomNo = roomNo;
    }

    public MarketplaceProfile getSeller() {
        return seller;
    }

    public void setSeller(MarketplaceProfile seller) {
        this.seller = seller;
    }
}