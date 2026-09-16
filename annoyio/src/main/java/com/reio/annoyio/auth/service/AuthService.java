package com.reio.annoyio.auth.service;

import com.reio.annoyio.auth.dto.LoginRequest;
import com.reio.annoyio.auth.dto.LoginResponse;
import com.reio.annoyio.auth.dto.ProfileRequest;
import com.reio.annoyio.auth.dto.RegisterRequest;
import com.reio.annoyio.auth.dto.VerifyOtpRequest;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository,
                       EmailService emailService) {

        this.userRepository = userRepository;
        this.emailService = emailService;
    }


    public void register(RegisterRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();

        boolean isGmail = cleanEmail.endsWith("@gmail.com");
        boolean isCollegeMail = cleanEmail.endsWith(".edu") || cleanEmail.endsWith(".ac.in") || cleanEmail.endsWith(".edu.in");

        if (!isGmail && !isCollegeMail) {
            throw new RuntimeException("Please use a valid @gmail.com or college email address (.edu / .ac.in)");
        }

        java.util.Optional<User> existingUserOpt = userRepository.findByEmail(cleanEmail);
        User user;

        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.isVerified()) {
                throw new RuntimeException("Email is already registered and verified. Please sign in.");
            }
            // User exists but has not verified yet: update password and allow receiving a fresh OTP
            user.setPassword(request.password());
        } else {
            user = new User();
            user.setEmail(cleanEmail);
            user.setPassword(request.password());
            user.setVerified(false);
        }

        String otp = String.valueOf(100000 + new java.util.Random().nextInt(900000));
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

        userRepository.save(user);
        emailService.sendotp(cleanEmail, otp);
    }

    public void verifyOtp(VerifyOtpRequest request){
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if(user.getOtp() == null || !user.getOtp().equals(request.otp())){
            throw new RuntimeException("Wrong OTP");
        }
        if(user.getOtpExpiry() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())){
            throw new RuntimeException("OTP Expired");
        }

        user.setVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);
    }

    public void updateProfile(ProfileRequest request){
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email before setting a profile");
        }

        String chosenUsername = request.username() != null && !request.username().isBlank()
                ? request.username().trim()
                : (request.anonymousName() != null ? request.anonymousName().trim() : null);

        if (chosenUsername != null && !chosenUsername.isBlank()) {
            user.setUsername(chosenUsername);
            user.setName(chosenUsername);
            userRepository.save(user);
        }
    }





}
