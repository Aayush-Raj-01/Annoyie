package com.reio.annoyio.gallery.dto;

import java.time.LocalDateTime;

public record GalleryPostResponse(
    Long id,
    String mediaUrl,
    String mediaType,
    String caption,
    LocalDateTime createdAt,
    Long uploaderId,
    String uploaderUsername,
    String uploaderAvatarUrl,
    String uploaderTag
) {}
