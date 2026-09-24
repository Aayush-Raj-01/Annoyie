package com.reio.annoyio.auth.service;

import com.reio.annoyio.auth.dto.*;
import com.reio.annoyio.security.JwtService;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import jakarta.validation.constraints.Email;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, EmailService emailService, JwtService jwtService,PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }


    public void register(RegisterRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();

//        boolean isGmail = cleanEmail.endsWith("@gmail.com");
        boolean isGmail = true;
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
            user.setPassword(passwordEncoder.encode(request.password()));
        } else {
            user = new User();
            user.setEmail(cleanEmail);
            user.setPassword(passwordEncoder.encode(request.password()));
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
        }

        if(request.gender() != null && !request.gender().isBlank()) {
            user.setGender(request.gender());
        }

        if(request.tag() != null && !request.tag().isBlank()) {
            user.setTag(request.tag());
        }

        if(request.avatarUrl() != null && !request.avatarUrl().isBlank()) {
            user.setAvatarUrl(request.avatarUrl().trim());
        }
        userRepository.save(user);
    }


    public LoginResponse login(LoginRequest request){
        User user = userRepository.findByEmail(request.email()).orElseThrow(() -> new RuntimeException("User not found"));

        if(!user.isVerified()){
            throw new RuntimeException("Email is not verified");
        }
        if(!passwordEncoder.matches((request.password()), user.getPassword())){
            throw new RuntimeException("Wrong Password");
        }
        String token = jwtService.generateToken(user.getEmail());
        return new LoginResponse(token);
    }

    public UserResponse me(String token){
        String email = jwtService.extractUsername(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserResponse(user.getEmail(), user.getUsername(), user.getGender(), user.getTag(), user.getAvatarUrl());
    }

    public String uploadAvatar(org.springframework.web.multipart.MultipartFile file, String email) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size must be less than 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Only image files (PNG, JPEG, WEBP, GIF) are allowed");
        }

        try {
            String originalName = file.getOriginalFilename();
            String ext = "";
            if (originalName != null && originalName.contains(".")) {
                ext = originalName.substring(originalName.lastIndexOf(".")).toLowerCase();
            } else {
                ext = ".jpg";
            }

            String filename = java.util.UUID.randomUUID().toString() + ext;
            java.nio.file.Path uploadDir = java.nio.file.Paths.get("uploads", "avatars");
            if (!java.nio.file.Files.exists(uploadDir)) {
                java.nio.file.Files.createDirectories(uploadDir);
            }

            java.nio.file.Path targetPath = uploadDir.resolve(filename);
            java.nio.file.Files.copy(file.getInputStream(), targetPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "http://localhost:8080/uploads/avatars/" + filename;

            if (email != null && !email.isBlank()) {
                userRepository.findByEmail(email.trim().toLowerCase()).ifPresent(user -> {
                    user.setAvatarUrl(avatarUrl);
                    userRepository.save(user);
                });
            }

            return avatarUrl;
        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store uploaded file: " + e.getMessage(), e);
        }
    }

}
