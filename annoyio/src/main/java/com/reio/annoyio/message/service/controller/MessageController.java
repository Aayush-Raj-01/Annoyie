package com.reio.annoyio.message.service.controller;


import com.reio.annoyio.auth.dto.UserResponse;
import com.reio.annoyio.auth.service.AuthService;
import com.reio.annoyio.message.service.MessageService;
import com.reio.annoyio.websocket.ChatMessage;
import com.reio.annoyio.websocket.entity.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService service;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthService authService;

    public MessageController(MessageService service, SimpMessagingTemplate messagingTemplate, AuthService authService){
        this.service = service;
        this.messagingTemplate = messagingTemplate;
        this.authService = authService;
    }

    @GetMapping("/{roomId}")
    public List<Message> getMessages(
            @PathVariable Long roomId,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ){
        // Year group privacy: other years cannot see messages from year-specific rooms (Rooms 2-5)
        if (roomId != null && roomId >= 2 && roomId <= 5) {
            int requiredYear = (int) (roomId - 1);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return List.of();
            }
            try {
                String token = authHeader.replace("Bearer ", "").trim();
                UserResponse me = authService.me(token);
                if (me == null || me.studentYear() == null || me.studentYear() != requiredYear) {
                    return List.of();
                }
            } catch (Exception ex) {
                return List.of();
            }
        }
        return service.getMessages(roomId);
    }

    @PostMapping
    public ChatMessage sendMessage(@RequestBody ChatMessage message) {
        ChatMessage saved = service.save(message);
        try {
            messagingTemplate.convertAndSend("/topic/messages", saved);
        } catch (Exception ignored) {
        }
        return saved;
    }

    @GetMapping("/dm/{user1Id}/{user2Id}")
    public List<Message> getConversation(
            @PathVariable Long user1Id,
            @PathVariable Long user2Id
    ) {
        return service.getConversation(
                user1Id,
                user2Id
        );
    }

    @GetMapping("/dm-conversations/{userId}")
    public List<com.reio.annoyio.message.dto.DMConversationResponse> getDmConversations(
            @PathVariable Long userId
    ) {
        return service.getDmConversations(userId);
    }

    @GetMapping("/dm-conversations")
    public List<com.reio.annoyio.message.dto.DMConversationResponse> getMyDmConversations(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.replace("Bearer ", "").trim();
                UserResponse me = authService.me(token);
                if (me != null && me.id() != null) {
                    return service.getDmConversations(me.id());
                }
            } catch (Exception ignored) {
            }
        }
        return List.of();
    }
}
