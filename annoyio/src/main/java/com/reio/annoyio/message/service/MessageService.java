package com.reio.annoyio.message.service;


import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import com.reio.annoyio.websocket.ChatMessage;
import com.reio.annoyio.websocket.entity.ChatRoom;
import com.reio.annoyio.websocket.entity.Message;
import com.reio.annoyio.websocket.repository.ChatRoomRepository;
import com.reio.annoyio.websocket.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MessageService {

    private final MessageRepository repository;
    private final ChatRoomRepository roomRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository repository, ChatRoomRepository roomRepository,
                          UserRepository userRepository) {
        this.repository = repository;
        this.roomRepository = roomRepository;
        this.userRepository = userRepository;
    }

    public ChatMessage save(ChatMessage dto) {
        Long roomId = dto.getRoomId() != null ? dto.getRoomId() : 1L;

        // Auto-find or create chat room so missing IDs never crash the broker
        ChatRoom room = roomRepository.findById(roomId).orElseGet(() -> {
            ChatRoom newRoom = new ChatRoom();
            newRoom.setId(roomId);
            newRoom.setName("Room #" + roomId);
            newRoom.setCreatedAt(LocalDateTime.now());
            return roomRepository.save(newRoom);
        });

        // Resolve user if they exist in the DB (by email or username)
        User senderUser = null;
        if (dto.getSenderEmail() != null && !dto.getSenderEmail().isBlank()) {
            senderUser = userRepository.findByEmail(dto.getSenderEmail()).orElse(null);
            if (senderUser == null) {
                senderUser = userRepository.findByUsername(dto.getSenderEmail()).orElse(null);
            }
        }
        if (senderUser == null && dto.getSender() != null && !dto.getSender().isBlank()) {
            senderUser = userRepository.findByUsername(dto.getSender()).orElse(null);
            if (senderUser == null) {
                senderUser = userRepository.findByEmail(dto.getSender()).orElse(null);
            }
        }

        // Determine public display name
        String displayName = dto.getSender();
        if (displayName == null || displayName.isBlank()) {
            if (senderUser != null && senderUser.getUsername() != null && !senderUser.getUsername().isBlank()) {
                displayName = senderUser.getUsername();
            } else if (dto.getSenderEmail() != null && !dto.getSenderEmail().isBlank()) {
                displayName = dto.getSenderEmail();
            } else {
                displayName = "Anonymous";
            }
        }

        // Determine user hobby/tag
        String tag = dto.getTag();
        if ((tag == null || tag.isBlank()) && senderUser != null) {
            tag = senderUser.getTag();
        }

        // Determine user avatarUrl
        String avatarUrl = dto.getAvatarUrl();
        if ((avatarUrl == null || avatarUrl.isBlank()) && senderUser != null) {
            avatarUrl = senderUser.getAvatarUrl();
        }

        // Determine student year
        Integer studentYear = dto.getStudentYear();
        if (studentYear == null && senderUser != null) {
            studentYear = senderUser.getStudentYear();
        }

        Message message = new Message();
        message.setSender(senderUser);
        message.setSenderEmail(displayName);
        message.setContent(dto.getContent());
        message.setCreatedAt(LocalDateTime.now());
        message.setRoom(room);
        message.setAvatarUrl(avatarUrl);
        Message saved = repository.save(message);

        // Populate DTO for broadcasting to all subscribers
        dto.setId(saved.getId());
        dto.setSender(displayName);
        dto.setSenderEmail(displayName);
        dto.setRoomId(roomId);
        dto.setCreatedAt(saved.getCreatedAt().toString());
        dto.setTag(tag);
        dto.setAvatarUrl(avatarUrl);
        dto.setStudentYear(studentYear);

        return dto;
    }

    public List<Message> getMessages(Long roomId) {
        return repository.findByRoomIdOrderByCreatedAt(roomId);
    }

}
