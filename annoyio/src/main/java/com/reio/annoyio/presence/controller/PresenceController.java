package com.reio.annoyio.presence.controller;

import com.reio.annoyio.admin.ActiveUserTracker;
import com.reio.annoyio.security.JwtService;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/presence")
public class PresenceController {

    private final ActiveUserTracker activeUserTracker;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public PresenceController(ActiveUserTracker activeUserTracker,
                              JwtService jwtService,
                              UserRepository userRepository) {
        this.activeUserTracker = activeUserTracker;
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @GetMapping("/online")
    public ResponseEntity<Map<String, Object>> getOnlineStatus() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("count", activeUserTracker.getActiveCount());
        resp.put("onlineUserIds", activeUserTracker.getOnlineUserIds());
        resp.put("onlineUsernames", activeUserTracker.getOnlineUsernames());
        resp.put("serverTime", System.currentTimeMillis());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkUser(
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "username", required = false) String username
    ) {
        boolean online = activeUserTracker.isUserOnline(userId, username);
        Long lastActive = activeUserTracker.getLastActiveTimestamp(userId, username);

        Map<String, Object> resp = new HashMap<>();
        resp.put("online", online);
        resp.put("userId", userId);
        resp.put("username", username);
        resp.put("lastActive", lastActive);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/heartbeat")
    public ResponseEntity<Map<String, Object>> heartbeat(
            @RequestBody(required = false) Map<String, Object> body,
            HttpServletRequest request
    ) {
        Long userId = null;
        String username = null;
        String email = null;

        if (body != null) {
            if (body.get("userId") instanceof Number n) userId = n.longValue();
            if (body.get("username") instanceof String u) username = u;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                email = jwtService.extractUsername(authHeader.substring(7).trim());
                if (email != null && !email.isBlank()) {
                    Optional<User> uOpt = userRepository.findByEmail(email);
                    if (uOpt.isPresent()) {
                        User u = uOpt.get();
                        userId = u.getId();
                        username = u.getUsername();
                    }
                }
            } catch (Exception ignored) {}
        }

        activeUserTracker.recordActivity(userId, username, email);
        return ResponseEntity.ok(Map.of("status", "ok", "online", true));
    }
}

