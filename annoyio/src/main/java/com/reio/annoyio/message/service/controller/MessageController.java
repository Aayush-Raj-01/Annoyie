package com.reio.annoyio.message.service.controller;


import com.reio.annoyio.auth.dto.UserResponse;
import com.reio.annoyio.auth.service.AuthService;
import com.reio.annoyio.message.service.MessageService;
import com.reio.annoyio.websocket.ChatMessage;
import com.reio.annoyio.websocket.entity.Message;
import com.reio.annoyio.security.CurrentUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService service;
    private final AuthService authService;
    private final CurrentUser currentUser;

    public MessageController(MessageService service, AuthService authService, CurrentUser currentUser){
        this.service = service;
        this.authService = authService;
        this.currentUser = currentUser;
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
        var user = currentUser.get();
        message.setSenderId(user.getId());
        message.setSenderEmail(user.getEmail());
        message.setSender(user.getUsername());
        message.setTag(user.getTag());
        message.setAvatarUrl(user.getAvatarUrl());
        message.setStudentYear(user.getStudentYear());
        return service.save(message);
    }

    @GetMapping("/dm/{user1Id}/{user2Id}")
    public List<Message> getConversation(
            @PathVariable Long user1Id,
            @PathVariable Long user2Id
    ) {
        Long myId = currentUser.get().getId();
        if (!myId.equals(user1Id) && !myId.equals(user2Id)) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        }
        return service.getConversation(
                user1Id,
                user2Id
        );
    }

    @GetMapping("/dm-conversations/{userId}")
    public List<com.reio.annoyio.message.dto.DMConversationResponse> getDmConversations(
            @PathVariable Long userId
    ) {
        currentUser.requireUserId(userId);
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
