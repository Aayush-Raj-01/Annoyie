package com.reio.annoyio.auth.dto;

public record LoginRequest(
        String email,
        String password
) {
}
