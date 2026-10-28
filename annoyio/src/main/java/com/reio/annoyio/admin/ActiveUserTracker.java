package com.reio.annoyio.admin;

import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class ActiveUserTracker {

    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ActiveUserTracker(UserRepository userRepository,
                             @Lazy SimpMessagingTemplate messagingTemplate) {
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public static class UserSessionInfo {
        private final String sessionId;
        private final Long userId;
        private final String username;
        private final String email;
        private final long connectedAt;

        public UserSessionInfo(String sessionId, Long userId, String username, String email, long connectedAt) {
            this.sessionId = sessionId;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.connectedAt = connectedAt;
        }

        public String getSessionId() { return sessionId; }
        public Long getUserId() { return userId; }
        public String getUsername() { return username; }
        public String getEmail() { return email; }
        public long getConnectedAt() { return connectedAt; }
    }

    // sessionId -> UserSessionInfo
    private final Map<String, UserSessionInfo> sessionMap = new ConcurrentHashMap<>();

    // userId -> active socket count
    private final Map<Long, Integer> userSessionCount = new ConcurrentHashMap<>();

    // username.toLowerCase() -> active socket count
    private final Map<String, Integer> usernameSessionCount = new ConcurrentHashMap<>();

    // email.toLowerCase() -> active socket count
    private final Map<String, Integer> emailSessionCount = new ConcurrentHashMap<>();

    // userId -> last activity timestamp ms
    private final Map<Long, Long> userLastActiveMap = new ConcurrentHashMap<>();

    // username.toLowerCase() -> last activity timestamp ms
    private final Map<String, Long> usernameLastActiveMap = new ConcurrentHashMap<>();

    @EventListener
    public void handleSessionConnected(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        if (sessionId == null) return;

        Long userId = null;
        String username = null;
        String email = null;

        Map<String, Object> attrs = accessor.getSessionAttributes();
        if (attrs != null) {
            if (attrs.get("userId") instanceof Long l) userId = l;
            else if (attrs.get("userId") instanceof Number n) userId = n.longValue();
            if (attrs.get("username") instanceof String u) username = u;
            if (attrs.get("email") instanceof String e) email = e;
        }

        if (email == null) {
            if (event.getUser() != null) {
                email = event.getUser().getName();
            } else if (accessor.getUser() != null) {
                email = accessor.getUser().getName();
            }
        }

        // If userId or username wasn't in attributes, look up by email
        if ((userId == null || username == null) && email != null && !email.isBlank()) {
            Optional<User> found = userRepository.findByEmail(email);
            if (found.isPresent()) {
                User u = found.get();
                userId = u.getId();
                username = u.getUsername();
                if (attrs != null) {
                    attrs.put("userId", userId);
                    attrs.put("username", username);
                    attrs.put("email", email);
                }
            }
        }

        long now = System.currentTimeMillis();
        UserSessionInfo info = new UserSessionInfo(sessionId, userId, username, email, now);
        sessionMap.put(sessionId, info);

        boolean wasAlreadyOnline = false;
        if (userId != null) {
            int prev = userSessionCount.getOrDefault(userId, 0);
            if (prev > 0) wasAlreadyOnline = true;
            userSessionCount.put(userId, prev + 1);
            userLastActiveMap.put(userId, now);
        }
        if (username != null && !username.isBlank()) {
            String uKey = username.toLowerCase().trim();
            int prev = usernameSessionCount.getOrDefault(uKey, 0);
            if (prev > 0) wasAlreadyOnline = true;
            usernameSessionCount.put(uKey, prev + 1);
            usernameLastActiveMap.put(uKey, now);
        }
        if (email != null && !email.isBlank()) {
            String eKey = email.toLowerCase().trim();
            emailSessionCount.put(eKey, emailSessionCount.getOrDefault(eKey, 0) + 1);
        }

        // Broadcast presence update if user just came online
        if (!wasAlreadyOnline && (userId != null || username != null)) {
            broadcastPresenceEvent(userId, username, true);
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        if (sessionId == null) return;

        UserSessionInfo removed = sessionMap.remove(sessionId);
        if (removed != null) {
            long now = System.currentTimeMillis();
            boolean isNowOffline = false;

            if (removed.getUserId() != null) {
                Long uid = removed.getUserId();
                userLastActiveMap.put(uid, now);
                Integer cnt = userSessionCount.compute(uid, (k, v) -> (v == null || v <= 1) ? null : v - 1);
                if (cnt == null || cnt <= 0) {
                    isNowOffline = true;
                }
            }

            if (removed.getUsername() != null && !removed.getUsername().isBlank()) {
                String uKey = removed.getUsername().toLowerCase().trim();
                usernameLastActiveMap.put(uKey, now);
                Integer cnt = usernameSessionCount.compute(uKey, (k, v) -> (v == null || v <= 1) ? null : v - 1);
                if (cnt == null || cnt <= 0) {
                    isNowOffline = true;
                }
            }

            if (removed.getEmail() != null && !removed.getEmail().isBlank()) {
                String eKey = removed.getEmail().toLowerCase().trim();
                emailSessionCount.compute(eKey, (k, v) -> (v == null || v <= 1) ? null : v - 1);
            }

            if (isNowOffline && (removed.getUserId() != null || removed.getUsername() != null)) {
                broadcastPresenceEvent(removed.getUserId(), removed.getUsername(), false);
            }
        }
    }

    public void recordActivity(Long userId, String username, String email) {
        long now = System.currentTimeMillis();
        if (userId != null) {
            userLastActiveMap.put(userId, now);
        }
        if (username != null && !username.isBlank()) {
            usernameLastActiveMap.put(username.toLowerCase().trim(), now);
        }
    }

    public boolean isUserOnline(Long userId, String username, String email) {
        // Active if currently has an open websocket connection
        if (userId != null && userSessionCount.getOrDefault(userId, 0) > 0) {
            return true;
        }
        if (username != null && !username.isBlank()) {
            String u = username.toLowerCase().trim();
            if (usernameSessionCount.getOrDefault(u, 0) > 0) {
                return true;
            }
        }
        if (email != null && !email.isBlank()) {
            String e = email.toLowerCase().trim();
            if (emailSessionCount.getOrDefault(e, 0) > 0) {
                return true;
            }
        }

        // Or recent heartbeat activity within the last 45 seconds (handling quick tab reloads)
        long recentCutoff = System.currentTimeMillis() - 45_000L;
        if (userId != null && userLastActiveMap.getOrDefault(userId, 0L) >= recentCutoff) {
            return true;
        }
        if (username != null && !username.isBlank()) {
            String u = username.toLowerCase().trim();
            if (usernameLastActiveMap.getOrDefault(u, 0L) >= recentCutoff) {
                return true;
            }
        }
        return false;
    }

    public boolean isUserOnline(Long userId, String username) {
        return isUserOnline(userId, username, null);
    }

    public boolean isUserOnline(String username) {
        return isUserOnline(null, username, null);
    }

    public Long getLastActiveTimestamp(Long userId, String username) {
        if (userId != null && userLastActiveMap.containsKey(userId)) {
            return userLastActiveMap.get(userId);
        }
        if (username != null) {
            String u = username.toLowerCase().trim();
            if (usernameLastActiveMap.containsKey(u)) {
                return usernameLastActiveMap.get(u);
            }
        }
        return null;
    }

    public Set<Long> getOnlineUserIds() {
        Set<Long> ids = new HashSet<>();
        long recentCutoff = System.currentTimeMillis() - 45_000L;

        for (Map.Entry<Long, Integer> entry : userSessionCount.entrySet()) {
            if (entry.getValue() > 0) {
                ids.add(entry.getKey());
            }
        }
        for (Map.Entry<Long, Long> entry : userLastActiveMap.entrySet()) {
            if (entry.getValue() >= recentCutoff) {
                ids.add(entry.getKey());
            }
        }
        return ids;
    }

    public Set<String> getOnlineUsernames() {
        Set<String> names = new HashSet<>();
        long recentCutoff = System.currentTimeMillis() - 45_000L;

        for (Map.Entry<String, Integer> entry : usernameSessionCount.entrySet()) {
            if (entry.getValue() > 0) {
                names.add(entry.getKey());
            }
        }
        for (Map.Entry<String, Long> entry : usernameLastActiveMap.entrySet()) {
            if (entry.getValue() >= recentCutoff) {
                names.add(entry.getKey());
            }
        }
        return names;
    }

    public int getActiveCount() {
        Set<Long> onlineIds = getOnlineUserIds();
        Set<String> onlineNames = getOnlineUsernames();
        return Math.max(sessionMap.size(), Math.max(onlineIds.size(), onlineNames.size()));
    }

    public List<String> getActiveUsersList() {
        return new ArrayList<>(getOnlineUsernames());
    }

    public int getConnectedSessionCount() {
        return sessionMap.size();
    }

    public List<Map<String, Object>> getActiveUserDetailsList(UserRepository repo) {
        Set<Long> onlineIds = getOnlineUserIds();
        Set<String> onlineNames = getOnlineUsernames();
        List<Map<String, Object>> result = new ArrayList<>();

        List<User> allUsers = repo.findAll();
        for (User u : allUsers) {
            boolean isOnline = (u.getId() != null && onlineIds.contains(u.getId()))
                    || (u.getUsername() != null && onlineNames.contains(u.getUsername().toLowerCase().trim()))
                    || isUserOnline(u.getId(), u.getUsername(), u.getEmail());

            if (isOnline) {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", u.getId());
                dto.put("username", u.getUsername());
                dto.put("email", u.getEmail());
                dto.put("studentYear", u.getStudentYear());
                dto.put("verified", u.isVerified());
                dto.put("tag", u.getTag());
                dto.put("avatarUrl", u.getAvatarUrl());
                dto.put("blocked", u.isBlocked());
                dto.put("active", true);
                dto.put("lastActive", getLastActiveTimestamp(u.getId(), u.getUsername()));
                result.add(dto);
            }
        }
        return result;
    }

    private void broadcastPresenceEvent(Long userId, String username, boolean online) {
        if (messagingTemplate == null) return;
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "PRESENCE_CHANGE");
            payload.put("userId", userId);
            payload.put("username", username);
            payload.put("online", online);
            payload.put("onlineUserIds", getOnlineUserIds());
            payload.put("onlineUsernames", getOnlineUsernames());
            payload.put("timestamp", System.currentTimeMillis());

            messagingTemplate.convertAndSend("/topic/presence", (Object) payload);
        } catch (Exception ex) {
            // Silently catch to not disrupt STOMP lifecycle
        }
    }
}
