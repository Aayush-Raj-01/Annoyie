package com.reio.annoyio.message.service.controller;


import com.reio.annoyio.message.service.MessageService;
import com.reio.annoyio.websocket.ChatMessage;
import com.reio.annoyio.websocket.entity.Message;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService service;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageController(MessageService service, SimpMessagingTemplate messagingTemplate){
        this.service = service;
        this.messagingTemplate = messagingTemplate;
    }

    @GetMapping("/{roomId}")
    public List<Message> getMessages(
            @PathVariable Long roomId
    ){
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
}
