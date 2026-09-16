package com.reio.annoyio.auth.dto;

public record LoginResponse(
        Long id,
        String email,
        String username,
        boolean verified
) {
}
