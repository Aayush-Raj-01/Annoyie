package com.reio.annoyio.security;

import com.reio.annoyio.marketplace.repository.MarketplaceProfileRepository;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class CurrentUser {
    private final UserRepository userRepository;
    private final MarketplaceProfileRepository profileRepository;

    public CurrentUser(UserRepository userRepository, MarketplaceProfileRepository profileRepository) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    public User get() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }

    public void requireUserId(Long userId) {
        if (userId == null || !get().getId().equals(userId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    public void requireMarketplaceProfileId(Long profileId) {
        boolean owned = profileId != null && profileRepository.findById(profileId)
                .map(profile -> profile.getUser() != null && get().getId().equals(profile.getUser().getId()))
                .orElse(false);
        if (!owned) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
    }
}
