package com.reio.annoyio.admin;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.concurrent.ConcurrentHashMap;

/**
 * Enforces security rate-limiting on the Admin panel:
 * Limits every IP to 3 failed attempts, then enforces a strict 10-minute lockout.
 */
@Component
public class AdminRateLimiter {

    public static final int MAX_ATTEMPTS = 3;
    public static final long TIMEOUT_DURATION_MS = 10 * 60 * 1000L; // 10 minutes (600,000 ms)

    public static class AttemptRecord {
        int attempts = 0;
        long lockedUntil = 0;
    }

    private final ConcurrentHashMap<String, AttemptRecord> ipMap = new ConcurrentHashMap<>();

    /**
     * Extracts client IP address taking into account reverse proxies, CDN or load balancers.
     */
    public String getClientIp(HttpServletRequest request) {
        if (request == null) return "unknown";
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return request.getRemoteAddr();
    }

    /**
     * Checks if the IP is currently locked out.
     */
    public synchronized boolean isLocked(String ip) {
        if (ip == null) return false;
        AttemptRecord record = ipMap.get(ip);
        if (record == null) return false;

        long now = System.currentTimeMillis();
        if (record.lockedUntil > now) {
            return true;
        }

        // Lock period has expired: reset state
        if (record.lockedUntil > 0 && record.lockedUntil <= now) {
            record.attempts = 0;
            record.lockedUntil = 0;
            return false;
        }

        return false;
    }

    /**
     * Returns remaining seconds in the 10-minute lockout.
     */
    public synchronized long getRemainingLockoutSeconds(String ip) {
        if (ip == null) return 0;
        AttemptRecord record = ipMap.get(ip);
        if (record == null) return 0;
        long diff = record.lockedUntil - System.currentTimeMillis();
        return diff > 0 ? (diff + 999) / 1000 : 0;
    }

    /**
     * Returns the number of attempts remaining before a 10-minute timeout is triggered.
     */
    public synchronized int getRemainingAttempts(String ip) {
        if (ip == null) return MAX_ATTEMPTS;
        AttemptRecord record = ipMap.get(ip);
        if (record == null) return MAX_ATTEMPTS;
        if (isLocked(ip)) return 0;
        return Math.max(0, MAX_ATTEMPTS - record.attempts);
    }

    /**
     * Records a failed attempt for the specified IP.
     * @return true if the attempt caused the IP to become locked out, false otherwise.
     */
    public synchronized boolean recordFailedAttempt(String ip) {
        if (ip == null) return false;
        long now = System.currentTimeMillis();
        AttemptRecord record = ipMap.computeIfAbsent(ip, k -> new AttemptRecord());

        // If previously expired, reset
        if (record.lockedUntil > 0 && record.lockedUntil <= now) {
            record.attempts = 0;
            record.lockedUntil = 0;
        }

        record.attempts++;
        if (record.attempts >= MAX_ATTEMPTS) {
            record.lockedUntil = now + TIMEOUT_DURATION_MS;
            return true;
        }

        return false;
    }

    /**
     * Clears failed attempt history upon successful admin authentication.
     */
    public synchronized void recordSuccess(String ip) {
        if (ip != null) {
            ipMap.remove(ip);
        }
    }
}
