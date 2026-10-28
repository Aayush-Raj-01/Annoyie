package com.reio.annoyio.admin;

import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.*;

@RestController
@RequestMapping({"/api/annoyoiadmin", "/annoyoiadmin"})
public class AdminController {

    private static final String ADMIN_USERNAME = "RASHMALAI";
    private static final String ADMIN_PASSWORD = "123123@123AA";

    private final UserRepository userRepository;
    private final ActiveUserTracker activeUserTracker;
    private final AdminRateLimiter rateLimiter;

    public AdminController(UserRepository userRepository,
                           ActiveUserTracker activeUserTracker,
                           AdminRateLimiter rateLimiter) {
        this.userRepository = userRepository;
        this.activeUserTracker = activeUserTracker;
        this.rateLimiter = rateLimiter;
    }

    private boolean isAuthorized(String username, String password, String authHeader) {
        if (ADMIN_USERNAME.equalsIgnoreCase(username) && ADMIN_PASSWORD.equals(password)) {
            return true;
        }

        // Support Authorization: Basic <base64>
        if (authHeader != null && authHeader.startsWith("Basic ")) {
            try {
                String base64Credentials = authHeader.substring(6).trim();
                byte[] credDecoded = Base64.getDecoder().decode(base64Credentials);
                String credentials = new String(credDecoded, StandardCharsets.UTF_8);
                String[] values = credentials.split(":", 2);
                if (values.length == 2) {
                    return ADMIN_USERNAME.equalsIgnoreCase(values[0]) && ADMIN_PASSWORD.equals(values[1]);
                }
            } catch (Exception ignored) {}
        }

        return false;
    }

    private ResponseEntity<?> buildLockedOutResponse(String ip) {
        long remainingSec = rateLimiter.getRemainingLockoutSeconds(ip);
        long minutes = remainingSec / 60;
        long seconds = remainingSec % 60;
        String timeStr = minutes > 0 ? (minutes + "m " + seconds + "s") : (seconds + "s");

        Map<String, Object> err = new HashMap<>();
        err.put("success", false);
        err.put("locked", true);
        err.put("remainingSeconds", remainingSec);
        err.put("error", "Too many failed attempts. This IP is locked out for 10 minutes. Please try again in " + timeStr + ".");
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(err);
    }

    public static class AdminLoginRequest {
        public String username;
        public String password;
    }

    @GetMapping("/rate-limit-status")
    public ResponseEntity<?> getRateLimitStatus(HttpServletRequest servletRequest) {
        String ip = rateLimiter.getClientIp(servletRequest);
        boolean locked = rateLimiter.isLocked(ip);
        long remainingSec = rateLimiter.getRemainingLockoutSeconds(ip);
        int remainingAttempts = rateLimiter.getRemainingAttempts(ip);

        Map<String, Object> resp = new HashMap<>();
        resp.put("ip", ip);
        resp.put("locked", locked);
        resp.put("remainingSeconds", remainingSec);
        resp.put("remainingAttempts", remainingAttempts);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/unlock")
    public ResponseEntity<?> unlockIp(
            @RequestParam(value = "pass", required = false) String pass,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest servletRequest
    ) {
        String p = pass != null ? pass : (body != null ? body.get("password") : null);
        if (ADMIN_PASSWORD.equals(p)) {
            String ip = rateLimiter.getClientIp(servletRequest);
            rateLimiter.recordSuccess(ip);
            return ResponseEntity.ok(Map.of("success", true, "message", "Lock cleared for IP: " + ip));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid admin password"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) AdminLoginRequest request,
                                   @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
                                   @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
                                   HttpServletRequest servletRequest) {
        String ip = rateLimiter.getClientIp(servletRequest);

        // Check if IP is currently locked out
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        String u = request != null && request.username != null ? request.username : headerUser;
        String p = request != null && request.password != null ? request.password : headerPass;

        if (isAuthorized(u, p, null)) {
            rateLimiter.recordSuccess(ip);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("admin", ADMIN_USERNAME);
            resp.put("message", "Welcome Admin RASHMALAI");
            return ResponseEntity.ok(resp);
        }

        // Authentication failed: record attempt
        boolean nowLocked = rateLimiter.recordFailedAttempt(ip);
        if (nowLocked) {
            return buildLockedOutResponse(ip);
        }

        int remaining = rateLimiter.getRemainingAttempts(ip);
        Map<String, Object> err = new HashMap<>();
        err.put("success", false);
        err.put("locked", false);
        err.put("remainingAttempts", remaining);
        err.put("error", "Invalid admin credentials. " + remaining + " attempt(s) remaining before 10-minute timeout.");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(err);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats(
            @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
            @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "user", required = false) String paramUser,
            @RequestParam(value = "pass", required = false) String paramPass,
            @RequestParam(value = "username", required = false) String queryUsername,
            @RequestParam(value = "password", required = false) String queryPassword,
            HttpServletRequest servletRequest
    ) {
        String ip = rateLimiter.getClientIp(servletRequest);
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        String u = headerUser != null ? headerUser : (paramUser != null ? paramUser : queryUsername);
        String p = headerPass != null ? headerPass : (paramPass != null ? paramPass : queryPassword);

        if (!isAuthorized(u, p, authHeader)) {
            boolean nowLocked = rateLimiter.recordFailedAttempt(ip);
            if (nowLocked) {
                return buildLockedOutResponse(ip);
            }
            int remaining = rateLimiter.getRemainingAttempts(ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized. " + remaining + " attempt(s) remaining before 10-minute timeout."));
        }

        rateLimiter.recordSuccess(ip);
        return ResponseEntity.ok(buildStatsPayload());
    }

    @PostMapping("/stats")
    public ResponseEntity<?> postStats(
            @RequestBody(required = false) AdminLoginRequest request,
            @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
            @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest servletRequest
    ) {
        String ip = rateLimiter.getClientIp(servletRequest);
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        String u = request != null && request.username != null ? request.username : headerUser;
        String p = request != null && request.password != null ? request.password : headerPass;

        if (!isAuthorized(u, p, authHeader)) {
            boolean nowLocked = rateLimiter.recordFailedAttempt(ip);
            if (nowLocked) {
                return buildLockedOutResponse(ip);
            }
            int remaining = rateLimiter.getRemainingAttempts(ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized. " + remaining + " attempt(s) remaining before 10-minute timeout."));
        }

        rateLimiter.recordSuccess(ip);
        return ResponseEntity.ok(buildStatsPayload());
    }

    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
            @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "user", required = false) String paramUser,
            @RequestParam(value = "pass", required = false) String paramPass,
            HttpServletRequest servletRequest
    ) {
        String ip = rateLimiter.getClientIp(servletRequest);
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        String u = headerUser != null ? headerUser : paramUser;
        String p = headerPass != null ? headerPass : paramPass;

        if (!isAuthorized(u, p, authHeader)) {
            boolean nowLocked = rateLimiter.recordFailedAttempt(ip);
            if (nowLocked) {
                return buildLockedOutResponse(ip);
            }
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        rateLimiter.recordSuccess(ip);

        List<User> all = userRepository.findAll();
        List<Map<String, Object>> userDtos = new ArrayList<>();
        for (User user : all) {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", user.getId());
            dto.put("username", user.getUsername());
            dto.put("email", user.getEmail());
            dto.put("studentYear", user.getStudentYear());
            dto.put("verified", user.isVerified());
            dto.put("tag", user.getTag());
            dto.put("avatarUrl", user.getAvatarUrl());
            dto.put("blocked", user.isBlocked());

            boolean isOnline = activeUserTracker.isUserOnline(user.getId(), user.getUsername(), user.getEmail());
            dto.put("active", isOnline);
            dto.put("lastActive", activeUserTracker.getLastActiveTimestamp(user.getId(), user.getUsername()));

            userDtos.add(dto);
        }

        return ResponseEntity.ok(userDtos);
    }

    @PostMapping("/users/{id}/block")
    public ResponseEntity<?> blockUser(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
            @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest servletRequest
    ) {
        String ip = rateLimiter.getClientIp(servletRequest);
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        if (!isAuthorized(headerUser, headerPass, authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        return userRepository.findById(id).map(user -> {
            user.setBlocked(true);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "blocked", true,
                    "message", "User @" + user.getUsername() + " has been blocked."
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/unblock")
    public ResponseEntity<?> unblockUser(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
            @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest servletRequest
    ) {
        String ip = rateLimiter.getClientIp(servletRequest);
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        if (!isAuthorized(headerUser, headerPass, authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        return userRepository.findById(id).map(user -> {
            user.setBlocked(false);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "blocked", false,
                    "message", "User @" + user.getUsername() + " has been unblocked."
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{id}/toggle-block")
    public ResponseEntity<?> toggleBlockUser(
            @PathVariable("id") Long id,
            @RequestHeader(value = "X-Admin-User", required = false) String headerUser,
            @RequestHeader(value = "X-Admin-Pass", required = false) String headerPass,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            HttpServletRequest servletRequest
    ) {
        String ip = rateLimiter.getClientIp(servletRequest);
        if (rateLimiter.isLocked(ip)) {
            return buildLockedOutResponse(ip);
        }

        if (!isAuthorized(headerUser, headerPass, authHeader)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized"));
        }

        return userRepository.findById(id).map(user -> {
            boolean nextState = !user.isBlocked();
            user.setBlocked(nextState);
            userRepository.save(user);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "blocked", nextState,
                    "message", nextState ? "User @" + user.getUsername() + " has been blocked." : "User @" + user.getUsername() + " has been unblocked."
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    private Map<String, Object> buildStatsPayload() {
        long totalUsers = userRepository.count();
        int activeCount = activeUserTracker.getActiveCount();
        int connectedSessions = activeUserTracker.getConnectedSessionCount();
        List<String> activeList = activeUserTracker.getActiveUsersList();
        List<Map<String, Object>> activeUsersList = activeUserTracker.getActiveUserDetailsList(userRepository);

        List<User> allUsers = userRepository.findAll();
        long verifiedUsers = allUsers.stream().filter(User::isVerified).count();
        long blockedUsers = allUsers.stream().filter(User::isBlocked).count();

        List<Map<String, Object>> recentUserSummaries = new ArrayList<>();
        int limit = Math.min(allUsers.size(), 10);
        for (int i = allUsers.size() - 1; i >= allUsers.size() - limit; i--) {
            User u = allUsers.get(i);
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", u.getId());
            dto.put("username", u.getUsername());
            dto.put("email", u.getEmail());
            dto.put("studentYear", u.getStudentYear());
            dto.put("verified", u.isVerified());
            dto.put("tag", u.getTag());
            dto.put("avatarUrl", u.getAvatarUrl());
            dto.put("blocked", u.isBlocked());
            dto.put("active", activeUserTracker.isUserOnline(u.getId(), u.getUsername(), u.getEmail()));
            recentUserSummaries.add(dto);
        }

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("activeUsers", Math.max(activeCount, activeUsersList.size()));
        stats.put("activeUsersList", activeUsersList);
        stats.put("activeUsernames", activeList);
        stats.put("verifiedUsers", verifiedUsers);
        stats.put("blockedUsers", blockedUsers);
        stats.put("connectedSessions", connectedSessions);
        stats.put("recentUsers", recentUserSummaries);
        stats.put("serverTime", new Date().toString());
        return stats;
    }
}
