package com.reio.annoyio.user.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.time.Year;

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

    @JsonIgnore
    private String password;

    private boolean verified;

    @JsonIgnore
    private String otp;

    @JsonIgnore
    private LocalDateTime otpExpiry;

    @Transient
    public Integer getStudentYear(){
        if (admissionYear == null) {
            return 1;
        }
        int currentYear = Year.now().getValue();
        int year = currentYear - admissionYear + 1;
        if (year < 1) return 1;
        if (year > 4) return 4;
        return year;
    }

    public void setStudentYear(Integer studentYear) {
        if (studentYear != null && studentYear >= 1 && studentYear <= 6) {
            this.admissionYear = Year.now().getValue() - studentYear + 1;
        }
    }

    private String gender;
    private String tag;
    private String avatarUrl;
    private Integer admissionYear;

    public Integer getAdmissionYear(){ return admissionYear;}
    public void setAdmissionYear(Integer admissionYear){this.admissionYear = admissionYear;}
    public User(){}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }

    public LocalDateTime getOtpExpiry() {
        return otpExpiry;
    }

    public void setOtpExpiry(LocalDateTime otpExpiry) {
        this.otpExpiry = otpExpiry;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getTag() {
        return tag;
    }

    public void setTag(String tag) {
        this.tag = tag;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
