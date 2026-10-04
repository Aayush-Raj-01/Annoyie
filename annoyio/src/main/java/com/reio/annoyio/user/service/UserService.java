package com.reio.annoyio.user.service;

import com.reio.annoyio.auth.dto.SearchUserResponse;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public List<SearchUserResponse> searchUsers(String query, Long excludeId, String excludeUsername){
        return userRepository.findByUsernameContainingIgnoreCase(query).stream()
                .filter(user -> {
                    if (excludeId != null && user.getId().equals(excludeId)) {
                        return false;
                    }
                    if (excludeUsername != null && !excludeUsername.isBlank() &&
                            user.getUsername().equalsIgnoreCase(excludeUsername.trim())) {
                        return false;
                    }
                    return true;
                })
                .map(user -> new SearchUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getAvatarUrl(),
                        user.getTag(),
                        user.getStudentYear()
                )).toList();
    }

    public List<SearchUserResponse> searchUsers(String query){
        return searchUsers(query, null, null);
    }

    public SearchUserResponse getUserById(Long id) {
        if (id == null) return null;
        return userRepository.findById(id)
                .map(user -> new SearchUserResponse(
                        user.getId(),
                        user.getUsername(),
                        user.getAvatarUrl(),
                        user.getTag(),
                        user.getStudentYear()
                ))
                .orElse(null);
    }
}
