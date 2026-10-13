package com.reio.annoyio.message.dto;

public record DMConversationResponse(
        Long userId,
        String username,
        String avatarUrl,
        String tag,
        Integer studentYear,
        String lastMessage,
        String lastMessageTime,
        int unreadCount
) {}
