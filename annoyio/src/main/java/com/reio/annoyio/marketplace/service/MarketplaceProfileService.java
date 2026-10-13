package com.reio.annoyio.marketplace.service;


import com.reio.annoyio.marketplace.dto.CreateMarketplaceProfileRequest;
import com.reio.annoyio.marketplace.dto.MarketplaceProfileResponse;
import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import com.reio.annoyio.marketplace.repository.MarketplaceProfileRepository;
import com.reio.annoyio.user.entity.User;
import com.reio.annoyio.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class MarketplaceProfileService {
    private final MarketplaceProfileRepository profileRepository;
    private final UserRepository userRepository;

    public MarketplaceProfileService(MarketplaceProfileRepository profileRepository, UserRepository userRepository){
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
    }

    public MarketplaceProfileResponse createProfile(Long userId, CreateMarketplaceProfileRequest request){
        User user = userRepository.findById(userId).orElseThrow(()-> new RuntimeException("User not Found"));

        // If user already has a marketplace profile, update and return it instead of throwing an error
        java.util.Optional<MarketplaceProfile> existingOpt = profileRepository.findByUserId(userId);
        if (existingOpt.isEmpty()) {
            existingOpt = profileRepository.findByUser(user);
        }
        if (existingOpt.isPresent()) {
            return updateProfile(userId, request);
        }

        if(request.displayName() != null && profileRepository.existsByDisplayName(request.displayName().trim())){
            throw new RuntimeException("Display name already taken");
        }

        MarketplaceProfile profile = new MarketplaceProfile();

        profile.setUser(user);
        profile.setDisplayName(request.displayName() != null ? request.displayName().trim() : null);
        profile.setBio(request.bio());
        profile.setPhoneNumber(request.phoneNumber());
        if (request.profileImage() != null && !request.profileImage().isBlank()) {
            profile.setProfileImage(request.profileImage().trim());
        }

        MarketplaceProfile saved = profileRepository.save(profile);
        return mapToResponse(saved);
    }

    public MarketplaceProfileResponse getProfileByUserId(Long userId){
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .or(() -> {
                    User user = userRepository.findById(userId).orElse(null);
                    return user != null ? profileRepository.findByUser(user) : java.util.Optional.empty();
                })
                .orElseThrow(() -> new RuntimeException("Marketplace profile not found"));
        return mapToResponse(profile);
    }

    public MarketplaceProfileResponse getProfileById(Long id){
        MarketplaceProfile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Marketplace profile not found"));
        return mapToResponse(profile);
    }

    public MarketplaceProfileResponse updateProfile(Long userId, CreateMarketplaceProfileRequest request){
        User user = userRepository.findById(userId).orElseThrow(()-> new RuntimeException("User not Found"));
        MarketplaceProfile profile = profileRepository.findByUserId(userId)
                .or(() -> profileRepository.findByUser(user))
                .orElseThrow(() -> new RuntimeException("Marketplace profile not found"));

        if(request.displayName() != null && !request.displayName().trim().equalsIgnoreCase(profile.getDisplayName())){
            if(profileRepository.existsByDisplayNameAndIdNot(request.displayName().trim(), profile.getId())){
                throw new RuntimeException("Display name already taken");
            }
            profile.setDisplayName(request.displayName().trim());
        }

        if(request.bio() != null){
            profile.setBio(request.bio());
        }
        if(request.phoneNumber() != null){
            profile.setPhoneNumber(request.phoneNumber());
        }
        if(request.profileImage() != null){
            if (request.profileImage().trim().isEmpty() || "REMOVE".equalsIgnoreCase(request.profileImage().trim())) {
                profile.setProfileImage(null);
            } else {
                profile.setProfileImage(request.profileImage().trim());
            }
        }

        MarketplaceProfile saved = profileRepository.save(profile);
        return mapToResponse(saved);
    }

    public boolean isDisplayNameAvailable(String displayName){
        if(displayName == null || displayName.trim().isBlank()){
            return false;
        }
        return !profileRepository.existsByDisplayName(displayName.trim());
    }

    private MarketplaceProfileResponse mapToResponse(MarketplaceProfile profile) {
        Long ownerUserId = (profile.getUser() != null) ? profile.getUser().getId() : null;
        return new MarketplaceProfileResponse(
                profile.getId(),
                profile.getDisplayName(),
                profile.getProfileImage(),
                profile.getBio(),
                profile.getPhoneNumber(),
                ownerUserId
        );
    }
}
