package com.reio.annoyio.auth.controller;


import com.reio.annoyio.auth.dto.*;
import com.reio.annoyio.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public String register(@RequestBody RegisterRequest request){
        authService.register(request);
        return "OTP sent successfully";
    }

    @PostMapping("/verify")
    public LoginResponse verify(@RequestBody VerifyOtpRequest request){
        return authService.verifyOtp(request);
    }

    @PostMapping("/profile")
    public UserResponse updateProfile(@RequestBody ProfileRequest request, Authentication authentication){
        if (authentication == null || request.email() == null || !authentication.getName().equalsIgnoreCase(request.email().trim())) {
            throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN);
        }
        return authService.updateProfile(request);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request){
        return authService.login(request);
    }

    @GetMapping("/me")
    public UserResponse me(@RequestHeader("Authorization") String authHeader){
        String token = authHeader.replace("Bearer ", "");
        return authService.me(token);
    }

    @PostMapping(value = "/upload-avatar", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public java.util.Map<String, String> uploadAvatar(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            Authentication authentication
    ) {
        String avatarUrl = authService.uploadAvatar(file, authentication.getName());
        return java.util.Map.of("avatarUrl", avatarUrl, "message", "Avatar uploaded successfully");
    }

    @ExceptionHandler(RuntimeException.class)
    public org.springframework.http.ResponseEntity<?> handleRuntimeException(RuntimeException e) {
        if (e instanceof org.springframework.web.server.ResponseStatusException status) {
            return org.springframework.http.ResponseEntity.status(status.getStatusCode())
                    .body(java.util.Map.of("message", status.getReason() != null ? status.getReason() : "Request failed"));
        }
        return org.springframework.http.ResponseEntity.badRequest().body(java.util.Map.of("message", e.getMessage() != null ? e.getMessage() : "An error occurred"));
    }
}
