package com.reio.annoyio.auth.controller;


import com.reio.annoyio.auth.dto.*;
import com.reio.annoyio.auth.service.AuthService;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
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
    public String verify(@RequestBody VerifyOtpRequest request){
        authService.verifyOtp(request);
        return "Verify OTP Success";
    }

    @PostMapping("/profile")
    public String updateProfile(@RequestBody ProfileRequest request){
        authService.updateProfile(request);
        return "Profile updated successfully";
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
            @RequestParam(value = "email", required = false) String email
    ) {
        String avatarUrl = authService.uploadAvatar(file, email);
        return java.util.Map.of("avatarUrl", avatarUrl, "message", "Avatar uploaded successfully");
    }
}
