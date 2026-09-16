package com.reio.annoyio.auth.dto;

public record RegisterRequest(
        String email,
        String password
) {
}
