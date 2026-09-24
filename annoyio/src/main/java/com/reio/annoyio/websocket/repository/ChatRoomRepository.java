package com.reio.annoyio.websocket.repository;

import com.reio.annoyio.websocket.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomRepository extends JpaRepository<ChatRoom,Long> {

}
