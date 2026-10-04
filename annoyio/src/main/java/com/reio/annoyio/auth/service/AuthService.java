package com.reio.annoyio.auth.service;

import com.reio.annoyio.auth.dto.*;
import com.reio.annoyio.security.JwtService;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import jakarta.validation.constraints.Email;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import com.reio.annoyio.websocket.entity.Message;
import com.reio.annoyio.websocket.repository.MessageRepository;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final MessageRepository messageRepository;

    public AuthService(UserRepository userRepository, EmailService emailService, JwtService jwtService, PasswordEncoder passwordEncoder, MessageRepository messageRepository) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.messageRepository = messageRepository;
    }


    public void register(RegisterRequest request) {
        if (request.email() == null || request.email().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();

        boolean isGmail = cleanEmail.endsWith("@imsec.ac.in");
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
        user.setAdmissionYear(
                extractAdmissionYear(request.email())
        );

        userRepository.save(user);
        emailService.sendotp(cleanEmail, otp);
    }

    public void verifyOtp(VerifyOtpRequest request){
        if (request.email() == null || request.email().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
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

    public UserResponse updateProfile(ProfileRequest request){
        if (request.email() == null || request.email().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.isVerified()) {
            throw new RuntimeException("Please verify your email before setting a profile");
        }

        if (request.studentYear() != null && request.studentYear() >= 1 && request.studentYear() <= 6) {
            user.setStudentYear(request.studentYear());
        } else if (request.admissionYear() != null && request.admissionYear() >= 2000 && request.admissionYear() <= 2040) {
            user.setAdmissionYear(request.admissionYear());
        } else if (user.getAdmissionYear() == null) {
            user.setAdmissionYear(extractAdmissionYear(user.getEmail()));
        }

        String oldUsername = user.getUsername();
        String oldName = user.getName();

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
        User saved = userRepository.save(user);

        // Ensure all messages belonging to this user are linked to this user's id and updated with their verified email
        try {
            List<Message> allMessages = messageRepository.findAll();
            for (Message m : allMessages) {
                boolean isUserMsg = (m.getSender() != null && m.getSender().getId().equals(saved.getId()));
                if (!isUserMsg && m.getSenderEmail() != null) {
                    String sEmail = m.getSenderEmail().trim();
                    if (sEmail.equalsIgnoreCase(saved.getEmail()) || 
                        (oldUsername != null && sEmail.equalsIgnoreCase(oldUsername)) ||
                        (oldName != null && sEmail.equalsIgnoreCase(oldName)) ||
                        (saved.getUsername() != null && sEmail.equalsIgnoreCase(saved.getUsername()))) {
                        isUserMsg = true;
                    }
                }
                if (isUserMsg) {
                    m.setSender(saved);
                    m.setSenderEmail(saved.getEmail());
                    messageRepository.save(m);
                }
            }
        } catch (Exception ex) {
            System.err.println("Notice: Could not sync legacy messages during profile update: " + ex.getMessage());
        }

        return new UserResponse(
                saved.getId(),
                saved.getEmail(),
                saved.getUsername(),
                saved.getGender(),
                saved.getTag(),
                saved.getAvatarUrl(),
                saved.getAdmissionYear(),
                saved.getStudentYear()
        );
    }


    public LoginResponse login(LoginRequest request){
        if (request.email() == null || request.email().isBlank()) {
            throw new RuntimeException("Email is required");
        }
        String cleanEmail = request.email().trim().toLowerCase();
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

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
        if (user.getAdmissionYear() == null && user.getEmail() != null) {
            Integer extracted = extractAdmissionYear(user.getEmail());
            if (extracted != null) {
                user.setAdmissionYear(extracted);
                userRepository.save(user);
            }
        }
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getGender(),
                user.getTag(),
                user.getAvatarUrl(),
                user.getAdmissionYear(),
                user.getStudentYear()
        );
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
    private Integer extractAdmissionYear(String email){
        if (email == null) return null;
        String clean = email.trim().toLowerCase();
        try {
            // 1. Explicit 4-digit year: 2018 to 2035
            java.util.regex.Matcher m4 = java.util.regex.Pattern.compile("(20[123][0-9])").matcher(clean);
            if (m4.find()) {
                return Integer.parseInt(m4.group(1));
            }

            // 2. Roll number starting with 2-digit year (e.g. 210143..., 220143..., 230143..., 240143..., 250143...)
            java.util.regex.Matcher mRoll = java.util.regex.Pattern.compile("^(\\d{2})\\d{4,}").matcher(clean);
            if (mRoll.find()) {
                int yy = Integer.parseInt(mRoll.group(1));
                if (yy >= 18 && yy <= 35) {
                    return 2000 + yy;
                }
            }

            // 3. Branch code + 2-digit year (e.g. cs22..., it23..., aiml24..., etc.)
            java.util.regex.Matcher mBranch = java.util.regex.Pattern.compile("[a-z]+(\\d{2})[a-z0-9]*@").matcher(clean);
            if (mBranch.find()) {
                int yy = Integer.parseInt(mBranch.group(1));
                if (yy >= 18 && yy <= 35) {
                    return 2000 + yy;
                }
            }
        } catch (Exception ignored) {}
        // Fallback default: current year - 1 (2nd year)
        return java.time.Year.now().getValue() - 1;
    }

    @jakarta.annotation.PostConstruct
    public void backfillMissingAdmissionYears() {
        try {
            List<User> users = userRepository.findAll();
            for (User u : users) {
                if (u.getAdmissionYear() == null) {
                    Integer yr = extractAdmissionYear(u.getEmail());
                    if (yr == null) yr = java.time.Year.now().getValue() - 1;
                    u.setAdmissionYear(yr);
                    userRepository.save(u);
                }
            }
        } catch (Exception ex) {
            System.err.println("Notice: Could not backfill user admission years: " + ex.getMessage());
        }
    }

}
