package com.reio.annoyio;

import com.reio.annoyio.websocket.entity.ChatRoom;
import com.reio.annoyio.websocket.repository.ChatRoomRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class AnnoyioApplication {

	public static void main(String[] args) {
		SpringApplication.run(AnnoyioApplication.class, args);
	}

	@Bean
	CommandLineRunner initChatRooms(ChatRoomRepository repository) {
		return args -> {
			createRoomIfMissing(repository, 1L, "All Year");
			createRoomIfMissing(repository, 2L, "Coders & Tech");
			createRoomIfMissing(repository, 3L, "Off-Topic & Chill");
			createRoomIfMissing(repository, 4L, "Anonymous Confessions");
		};
	}

	private void createRoomIfMissing(ChatRoomRepository repo, Long id, String name) {
		if (!repo.existsById(id)) {
			ChatRoom room = new ChatRoom();
			room.setId(id);
			room.setName(name);
			room.setCreatedAt(LocalDateTime.now());
			repo.save(room);
		}
	}
}
