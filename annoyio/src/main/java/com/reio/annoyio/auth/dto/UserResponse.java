package com.reio.annoyio.auth.dto;

public record UserResponse (
        Long id,
        String email,
        String username,
        String gender,
        String tag,
        String avatarUrl,
        Integer admissionYear,
        Integer studentYear,
        Boolean blocked
) {
    public UserResponse(Long id, String email, String username, String gender, String tag, String avatarUrl, Integer admissionYear, Integer studentYear) {
        this(id, email, username, gender, tag, avatarUrl, admissionYear, studentYear, false);
    }
}
