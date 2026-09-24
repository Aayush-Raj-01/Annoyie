package com.reio.annoyio.message.service.controller;


import com.reio.annoyio.message.service.MessageService;
import com.reio.annoyio.websocket.entity.Message;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/messages")
public class MessageController {

    private final MessageService service;

    public MessageController(MessageService service){
        this.service = service;
    }
    @GetMapping("/{roomId}")
    public List<Message> getMessages(
            @PathVariable Long roomId
    ){
        return service.getMessages(roomId);
    }
}
