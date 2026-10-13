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
			createRoomIfMissing(repository, 2L, "1st Year");
			createRoomIfMissing(repository, 3L, "2nd Year");
			createRoomIfMissing(repository, 4L, "3rd Year");
			createRoomIfMissing(repository, 5L, "4th Year");
			createRoomIfMissing(repository, 6L, "Coding");
			createRoomIfMissing(repository, 7L, "Creative");
			createRoomIfMissing(repository, 8L, "Study");
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
