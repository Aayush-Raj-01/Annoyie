package com.reio.annoyio.user.entity;


import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String username;
    private String email;
    private String password;
    private boolean verified;
    private String otp;
    private LocalDateTime otpExpiry;
    private String gender;
    private String tag;

    public User(){}
}
