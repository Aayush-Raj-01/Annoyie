package com.reio.annoyio.user.controller;

import com.reio.annoyio.auth.dto.SearchUserResponse;
import com.reio.annoyio.user.service.UserService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@CrossOrigin(origins = "*")
@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService){
        this.userService = userService;
    }

    @GetMapping("/api/users/search")
    public List<SearchUserResponse> searchUsers(
            @RequestParam String query,
            @RequestParam(required = false) Long excludeId,
            @RequestParam(required = false) String excludeUsername){
        return userService.searchUsers(query, excludeId, excludeUsername);
    }

    @GetMapping("/api/users/{id}")
    public org.springframework.http.ResponseEntity<SearchUserResponse> getUserById(@org.springframework.web.bind.annotation.PathVariable Long id) {
        SearchUserResponse res = userService.getUserById(id);
        if (res == null) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }
        return org.springframework.http.ResponseEntity.ok(res);
    }
}
