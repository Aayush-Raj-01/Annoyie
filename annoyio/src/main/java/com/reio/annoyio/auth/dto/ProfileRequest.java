package com.reio.annoyio.auth.dto;

public record ProfileRequest(
        String email,
        String username,
        String anonymousName,
        String gender,
        String tag
) {
}
