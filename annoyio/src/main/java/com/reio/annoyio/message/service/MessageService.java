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

        // Resolve user if they exist in the DB (by email or username or id)
        User senderUser = null;
        if (dto.getSenderId() != null) {
            senderUser = userRepository.findById(dto.getSenderId()).orElse(null);
        }
        if (senderUser == null && dto.getSenderEmail() != null && !dto.getSenderEmail().isBlank()) {
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

        if (senderUser == null) {
            throw new RuntimeException("Unauthorized: You must be logged in to send messages");
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

        // Determine user avatarUrl - senderUser is authoritative
        String avatarUrl = senderUser != null ? senderUser.getAvatarUrl() : dto.getAvatarUrl();

        // Determine student year
        Integer studentYear = dto.getStudentYear();
        if (studentYear == null && senderUser != null) {
            studentYear = senderUser.getStudentYear();
        }

        User receiverUser = null;

        if(dto.getReceiverId() != null){
            receiverUser = userRepository.findById(dto.getReceiverId()).orElse(null);
            if (senderUser != null && receiverUser != null && senderUser.getId().equals(receiverUser.getId())) {
                throw new IllegalArgumentException("Cannot send direct message to yourself");
            }
        }

        // De-duplicate rapid submissions (double clicks, enter key + form submit, retries within 3s)
        if (senderUser != null && dto.getContent() != null && !dto.getContent().isBlank()) {
            LocalDateTime cutoff = LocalDateTime.now().minusSeconds(3);
            List<Message> recent = repository.findRecentBySender(senderUser.getId(), cutoff);
            for (Message r : recent) {
                boolean sameRoom = (room == null && r.getRoom() == null) ||
                        (room != null && r.getRoom() != null && room.getId().equals(r.getRoom().getId()));
                boolean sameReceiver = (receiverUser == null && r.getReceiver() == null) ||
                        (receiverUser != null && r.getReceiver() != null && receiverUser.getId().equals(r.getReceiver().getId()));
                if (sameRoom && sameReceiver && dto.getContent().trim().equals(r.getContent())) {
                    dto.setId(r.getId());
                    dto.setSenderId(senderUser.getId());
                    dto.setReceiverId(receiverUser != null ? receiverUser.getId() : dto.getReceiverId());
                    dto.setSender(senderUser.getUsername() != null ? senderUser.getUsername() : displayName);
                    dto.setSenderEmail(senderUser.getEmail() != null ? senderUser.getEmail() : displayName);
                    dto.setRoomId(roomId);
                    dto.setCreatedAt(r.getCreatedAt().toString());
                    dto.setTag(senderUser.getTag() != null ? senderUser.getTag() : tag);
                    dto.setAvatarUrl(avatarUrl);
                    dto.setStudentYear(senderUser.getStudentYear() != null ? senderUser.getStudentYear() : studentYear);
                    return dto;
                }
            }
        }

        Message message = new Message();
        message.setSender(senderUser);
        message.setSenderEmail(senderUser.getEmail() != null ? senderUser.getEmail() : displayName);
        message.setContent(dto.getContent().trim());
        message.setCreatedAt(LocalDateTime.now());
        message.setRoom(room);
        message.setAvatarUrl(avatarUrl);
        message.setReceiver(receiverUser);
        Message saved = repository.save(message);

        // Populate DTO for broadcasting to all subscribers
        dto.setId(saved.getId());
        dto.setSenderId(senderUser.getId());
        dto.setReceiverId(receiverUser != null ? receiverUser.getId() : dto.getReceiverId());
        dto.setSender(senderUser.getUsername() != null ? senderUser.getUsername() : displayName);
        dto.setSenderEmail(senderUser.getEmail() != null ? senderUser.getEmail() : displayName);
        dto.setRoomId(roomId);
        dto.setCreatedAt(saved.getCreatedAt().toString());
        dto.setTag(senderUser.getTag() != null ? senderUser.getTag() : tag);
        dto.setAvatarUrl(avatarUrl);
        dto.setStudentYear(senderUser.getStudentYear() != null ? senderUser.getStudentYear() : studentYear);

        return dto;
    }

    @jakarta.annotation.PostConstruct
    public void backfillMissingSenders() {
        try {
            List<Message> missingSender = repository.findAllBySenderIsNull();
            for (Message m : missingSender) {
                if (m.getSenderEmail() != null && !m.getSenderEmail().isBlank()) {
                    String val = m.getSenderEmail().trim();
                    userRepository.findByEmail(val.toLowerCase())
                            .or(() -> userRepository.findByUsername(val))
                            .ifPresent(u -> {
                                m.setSender(u);
                                if (u.getEmail() != null) {
                                    m.setSenderEmail(u.getEmail());
                                }
                                repository.save(m);
                            });
                }
            }
            // Ensure all messages linked to users have senderEmail set to user's real email and avatar synced
            List<Message> allLinked = repository.findAll();
            for (Message m : allLinked) {
                boolean changed = false;
                if (m.getSender() != null && m.getSender().getEmail() != null) {
                    if (!m.getSender().getEmail().equalsIgnoreCase(m.getSenderEmail())) {
                        m.setSenderEmail(m.getSender().getEmail());
                        changed = true;
                    }
                }
                if (m.getSender() != null) {
                    String userAvatar = m.getSender().getAvatarUrl();
                    if ((userAvatar == null && m.getAvatarUrl() != null) ||
                        (userAvatar != null && !userAvatar.equals(m.getAvatarUrl()))) {
                        m.setAvatarUrl(userAvatar);
                        changed = true;
                    }
                }
                if (changed) {
                    repository.save(m);
                }
            }
        } catch (Exception ex) {
            System.err.println("Notice: Could not backfill legacy message senders: " + ex.getMessage());
        }
    }

    public List<Message> getMessages(Long roomId) {
        return repository.findByRoomIdOrderByCreatedAt(roomId);
    }

    public List<Message> getConversation(
            Long user1Id,
            Long user2Id
    ) {
        if (user1Id != null && user1Id.equals(user2Id)) {
            return List.of();
        }
        return repository.findConversation(
                user1Id,
                user2Id
        );
    }

}
