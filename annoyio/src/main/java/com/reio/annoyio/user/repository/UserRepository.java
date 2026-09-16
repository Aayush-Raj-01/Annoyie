package com.reio.annoyio.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.reio.annoyio.user.entity.User;

public interface UserRepository
        extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
}
