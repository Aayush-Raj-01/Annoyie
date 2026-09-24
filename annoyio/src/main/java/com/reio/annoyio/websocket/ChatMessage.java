package com.reio.annoyio.websocket;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {
    private Long id;
    private String sender;
    private String senderEmail;
    private Long roomId;
    private String content;
    private String createdAt;
    private String tag;
}
