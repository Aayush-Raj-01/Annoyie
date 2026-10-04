package com.reio.annoyio.websocket.entity;


import com.reio.annoyio.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String senderEmail;

    @ManyToOne
    @JoinColumn(name = "sender_id")
    private User sender;

    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String Content;

    private LocalDateTime createdAt;

    @ManyToOne
    @JoinColumn(name = "room_id")
    private ChatRoom room;

    @ManyToOne
    @JoinColumn(name = "receiver_id")
    private User receiver;

    public User getReceiver(){
        return receiver;
    }
    public void setReceiver(User receiver){
        this.receiver = receiver;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSenderId() {
        return sender != null ? sender.getId() : null;
    }

    public String getSenderUsername() {
        return sender != null ? sender.getUsername() : null;
    }

    public String getSenderEmail() {
        if (sender != null && sender.getEmail() != null && !sender.getEmail().isBlank()) {
            return sender.getEmail();
        }
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
    }

    public String getAvatarUrl() {
        if (sender != null) {
            return sender.getAvatarUrl();
        }
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getTag() {
        return sender != null ? sender.getTag() : null;
    }

    public String getContent() {
        return Content;
    }

    public void setContent(String content) {
        Content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public ChatRoom getRoom() {
        return room;
    }

    public void setRoom(ChatRoom room) {
        this.room = room;
    }

    @Transient
    public Integer getStudentYear() {
        return sender != null ? sender.getStudentYear() : null;
    }
}
