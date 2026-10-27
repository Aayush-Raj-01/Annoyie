package com.reio.annoyio.marketplace.service;

import com.reio.annoyio.marketplace.dto.MarketplaceMessageResponse;
import com.reio.annoyio.marketplace.dto.MarketplaceThreadResponse;
import com.reio.annoyio.marketplace.dto.SendMarketplaceMessageRequest;
import com.reio.annoyio.marketplace.entity.MarketplaceListing;
import com.reio.annoyio.marketplace.entity.MarketplaceMessage;
import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import com.reio.annoyio.marketplace.repository.MarketplaceListingRepository;
import com.reio.annoyio.marketplace.repository.MarketplaceMessageRepository;
import com.reio.annoyio.marketplace.repository.MarketplaceProfileRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class MarketplaceMessageService {

    private final MarketplaceMessageRepository messageRepository;
    private final MarketplaceProfileRepository profileRepository;
    private final MarketplaceListingRepository listingRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.reio.annoyio.marketplace.repository.MarketplaceBlockRepository blockRepository;

    public MarketplaceMessageService(
            MarketplaceMessageRepository messageRepository,
            MarketplaceProfileRepository profileRepository,
            MarketplaceListingRepository listingRepository,
            SimpMessagingTemplate messagingTemplate,
            com.reio.annoyio.marketplace.repository.MarketplaceBlockRepository blockRepository
    ) {
        this.messageRepository = messageRepository;
        this.profileRepository = profileRepository;
        this.listingRepository = listingRepository;
        this.messagingTemplate = messagingTemplate;
        this.blockRepository = blockRepository;
    }

    public MarketplaceMessageResponse sendMessage(SendMarketplaceMessageRequest request) {
        if (request.senderProfileId() == null || request.receiverProfileId() == null) {
            throw new IllegalArgumentException("Sender and receiver profile IDs are required");
        }
        if (request.senderProfileId().equals(request.receiverProfileId())) {
            throw new IllegalArgumentException("Cannot send a marketplace message to yourself");
        }
        if (blockRepository.isBlockedEitherWay(request.senderProfileId(), request.receiverProfileId())) {
            throw new IllegalArgumentException("Cannot send message. Communication between these marketplace profiles is blocked.");
        }
        if (request.content() == null || request.content().trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        MarketplaceProfile sender = profileRepository.findById(request.senderProfileId())
                .orElseThrow(() -> new RuntimeException("Sender profile not found"));
        MarketplaceProfile receiver = profileRepository.findById(request.receiverProfileId())
                .orElseThrow(() -> new RuntimeException("Receiver profile not found"));

        MarketplaceListing listing = null;
        if (request.listingId() != null) {
            listing = listingRepository.findById(request.listingId()).orElse(null);
        }

        MarketplaceMessage message = new MarketplaceMessage();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setListing(listing);
        message.setContent(request.content().trim());
        message.setCreatedAt(LocalDateTime.now());
        message.setRead(false);

        MarketplaceMessage saved = messageRepository.save(message);
        MarketplaceMessageResponse response = mapToResponse(saved);

        // Private messages are only sent to the two authenticated participants.
        try {
            if (sender.getUser() != null) {
                messagingTemplate.convertAndSendToUser(sender.getUser().getEmail(), "/queue/marketplace-messages", response);
            }
            if (receiver.getUser() != null) {
                messagingTemplate.convertAndSendToUser(receiver.getUser().getEmail(), "/queue/marketplace-messages", response);
            }
        } catch (Exception ignored) {
        }

        return response;
    }

    public List<MarketplaceMessageResponse> getConversation(Long myProfileId, Long otherProfileId) {
        if (myProfileId == null || otherProfileId == null) {
            return Collections.emptyList();
        }

        // Mark incoming messages as read
        try {
            messageRepository.markConversationAsRead(myProfileId, otherProfileId);
        } catch (Exception ignored) {
        }

        List<MarketplaceMessage> messages = messageRepository.findConversation(myProfileId, otherProfileId);
        return messages.stream().map(this::mapToResponse).toList();
    }

    public List<MarketplaceThreadResponse> getConversationThreads(Long profileId) {
        if (profileId == null) {
            return Collections.emptyList();
        }

        List<MarketplaceMessage> allMessages = messageRepository.findRecentForProfile(profileId);
        Map<Long, List<MarketplaceMessage>> groupedByPartner = new LinkedHashMap<>();

        for (MarketplaceMessage msg : allMessages) {
            Long partnerId = msg.getSender().getId().equals(profileId)
                    ? msg.getReceiver().getId()
                    : msg.getSender().getId();

            groupedByPartner.computeIfAbsent(partnerId, k -> new ArrayList<>()).add(msg);
        }

        List<MarketplaceThreadResponse> threads = new ArrayList<>();
        for (Map.Entry<Long, List<MarketplaceMessage>> entry : groupedByPartner.entrySet()) {
            Long partnerId = entry.getKey();
            List<MarketplaceMessage> threadMsgs = entry.getValue();
            if (threadMsgs.isEmpty()) continue;

            MarketplaceMessage latest = threadMsgs.get(0);
            MarketplaceProfile partner = latest.getSender().getId().equals(profileId)
                    ? latest.getReceiver()
                    : latest.getSender();

            int unread = (int) threadMsgs.stream()
                    .filter(m -> m.getReceiver().getId().equals(profileId) && !m.isRead())
                    .count();

            Long listingId = latest.getListing() != null ? latest.getListing().getId() : null;
            String listingTitle = latest.getListing() != null ? latest.getListing().getTitle() : null;
            Double listingPrice = latest.getListing() != null ? latest.getListing().getPrice() : null;

            threads.add(new MarketplaceThreadResponse(
                    partner.getId(),
                    partner.getDisplayName(),
                    partner.getProfileImage(),
                    listingId,
                    listingTitle,
                    listingPrice,
                    latest.getContent(),
                    latest.getCreatedAt() != null ? latest.getCreatedAt().toString() : "",
                    unread
            ));
        }

        return threads;
    }

    public long getUnreadCount(Long profileId) {
        if (profileId == null) return 0;
        return messageRepository.countUnreadMessages(profileId);
    }

    private MarketplaceMessageResponse mapToResponse(MarketplaceMessage m) {
        return new MarketplaceMessageResponse(
                m.getId(),
                m.getSender().getId(),
                m.getSender().getDisplayName(),
                m.getSender().getProfileImage(),
                m.getReceiver().getId(),
                m.getReceiver().getDisplayName(),
                m.getReceiver().getProfileImage(),
                m.getListing() != null ? m.getListing().getId() : null,
                m.getListing() != null ? m.getListing().getTitle() : null,
                m.getListing() != null ? m.getListing().getPrice() : null,
                m.getContent(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : LocalDateTime.now().toString(),
                m.isRead()
        );
    }
}
