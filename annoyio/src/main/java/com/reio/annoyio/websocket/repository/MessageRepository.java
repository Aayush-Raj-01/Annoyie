package com.reio.annoyio.websocket.repository;

import com.reio.annoyio.websocket.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {


    List<Message> findByRoomIdOrderByCreatedAt(
            Long roomId
    );

    List<Message> findByRoomIdAndReceiverIsNullOrderByCreatedAt(Long roomId);
    @Query("""
SELECT m
FROM Message m
WHERE
(m.sender.id = :user1Id AND m.receiver.id = :user2Id)
OR
(m.sender.id = :user2Id AND m.receiver.id = :user1Id)
ORDER BY m.createdAt
""")
    List<Message> findConversation(
            Long user1Id,
            Long user2Id
    );

    List<Message> findAllBySenderIsNull();

    @Query("""
    SELECT m FROM Message m
    WHERE m.sender.id = :senderId AND m.createdAt >= :cutoff
    ORDER BY m.createdAt DESC
    """)
    List<Message> findRecentBySender(
            @org.springframework.data.repository.query.Param("senderId") Long senderId,
            @org.springframework.data.repository.query.Param("cutoff") java.time.LocalDateTime cutoff
    );

    @Query("""
    SELECT m FROM Message m
    WHERE (m.sender.id = :userId OR m.receiver.id = :userId)
      AND m.receiver IS NOT NULL
    ORDER BY m.createdAt DESC
    """)
    List<Message> findDmMessagesForUser(
            @org.springframework.data.repository.query.Param("userId") Long userId
    );
}
