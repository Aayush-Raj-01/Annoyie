package com.reio.annoyio.auth.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.stereotype.Service;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class EmailService {
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }
    public void sendotp(String email, String otp){
        SimpleMailMessage message = new SimpleMailMessage();

        message.setFrom("dwx1110804@gmail.com");
        message.setTo(email);
        message.setSubject("VERIFICATION CODE");
        message.setText("Your Annoyoi Account Creation Verification code is: " + otp);
        mailSender.send(message);
    }

}
