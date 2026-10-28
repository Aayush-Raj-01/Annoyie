package com.reio.annoyio.marketplace.controller;

import com.reio.annoyio.marketplace.dto.MarketplaceMessageResponse;
import com.reio.annoyio.marketplace.dto.MarketplaceThreadResponse;
import com.reio.annoyio.marketplace.dto.SendMarketplaceMessageRequest;
import com.reio.annoyio.marketplace.service.MarketplaceMessageService;
import com.reio.annoyio.security.CurrentUser;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/marketplace/messages", "/api/marketplace/messages"})
public class MarketplaceMessageController {

    private final MarketplaceMessageService messageService;
    private final CurrentUser currentUser;

    public MarketplaceMessageController(MarketplaceMessageService messageService, CurrentUser currentUser) {
        this.messageService = messageService;
        this.currentUser = currentUser;
    }

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody SendMarketplaceMessageRequest request) {
        currentUser.requireMarketplaceProfileId(request.senderProfileId());
        try {
            MarketplaceMessageResponse response = messageService.sendMessage(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{myProfileId}/{otherProfileId}")
    public ResponseEntity<List<MarketplaceMessageResponse>> getConversation(
            @PathVariable Long myProfileId,
            @PathVariable Long otherProfileId
    ) {
        currentUser.requireMarketplaceProfileId(myProfileId);
        return ResponseEntity.ok(messageService.getConversation(myProfileId, otherProfileId));
    }

    @GetMapping("/threads/{profileId}")
    public ResponseEntity<List<MarketplaceThreadResponse>> getThreads(@PathVariable Long profileId) {
        currentUser.requireMarketplaceProfileId(profileId);
        return ResponseEntity.ok(messageService.getConversationThreads(profileId));
    }

    @GetMapping("/unread-count/{profileId}")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@PathVariable Long profileId) {
        currentUser.requireMarketplaceProfileId(profileId);
        long count = messageService.getUnreadCount(profileId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}
