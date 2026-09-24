package com.reio.annoyio.websocket.repository;

import com.reio.annoyio.websocket.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {


    List<Message> findByRoomIdOrderByCreatedAt(
            Long roomId
    );
}
