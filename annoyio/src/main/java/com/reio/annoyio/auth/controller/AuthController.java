package com.reio.annoyio.auth.controller;


import com.reio.annoyio.auth.dto.ProfileRequest;
import com.reio.annoyio.auth.dto.RegisterRequest;
import com.reio.annoyio.auth.dto.VerifyOtpRequest;
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
}
