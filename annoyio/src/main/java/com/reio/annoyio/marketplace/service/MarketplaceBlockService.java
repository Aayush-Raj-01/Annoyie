package com.reio.annoyio.marketplace.service;

import com.reio.annoyio.marketplace.dto.MarketplaceBlockStatusResponse;
import com.reio.annoyio.marketplace.dto.MarketplaceBlockedProfileResponse;
import com.reio.annoyio.marketplace.entity.MarketplaceBlock;
import com.reio.annoyio.marketplace.entity.MarketplaceProfile;
import com.reio.annoyio.marketplace.repository.MarketplaceBlockRepository;
import com.reio.annoyio.marketplace.repository.MarketplaceProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;

@Service
public class MarketplaceBlockService {

    private final MarketplaceBlockRepository blockRepository;
    private final MarketplaceProfileRepository profileRepository;

    public MarketplaceBlockService(
            MarketplaceBlockRepository blockRepository,
            MarketplaceProfileRepository profileRepository
    ) {
        this.blockRepository = blockRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public MarketplaceBlockedProfileResponse blockProfile(Long blockerProfileId, Long targetProfileId) {
        if (blockerProfileId == null || targetProfileId == null) {
            throw new IllegalArgumentException("Blocker profile ID and target profile ID are required");
        }
        if (blockerProfileId.equals(targetProfileId)) {
            throw new IllegalArgumentException("You cannot block your own marketplace profile");
        }

        MarketplaceProfile blocker = profileRepository.findById(blockerProfileId)
                .orElseThrow(() -> new RuntimeException("Blocker profile not found"));
        MarketplaceProfile target = profileRepository.findById(targetProfileId)
                .orElseThrow(() -> new RuntimeException("Target profile not found"));

        MarketplaceBlock block = blockRepository
                .findByBlockerProfileIdAndBlockedProfileId(blockerProfileId, targetProfileId)
                .orElseGet(() -> {
                    MarketplaceBlock newBlock = new MarketplaceBlock(blocker, target);
                    return blockRepository.save(newBlock);
                });

        return new MarketplaceBlockedProfileResponse(
                block.getId(),
                target.getId(),
                target.getDisplayName(),
                target.getProfileImage(),
                block.getCreatedAt() != null ? block.getCreatedAt().toString() : ""
        );
    }

    @Transactional
    public void unblockProfile(Long blockerProfileId, Long targetProfileId) {
        if (blockerProfileId == null || targetProfileId == null) {
            return;
        }
        blockRepository.deleteByBlockerProfileIdAndBlockedProfileId(blockerProfileId, targetProfileId);
    }

    public List<MarketplaceBlockedProfileResponse> getBlockedProfiles(Long blockerProfileId) {
        if (blockerProfileId == null) {
            return Collections.emptyList();
        }
        List<MarketplaceBlock> list = blockRepository.findByBlockerProfileIdOrderByCreatedAtDesc(blockerProfileId);
        return list.stream().map(b -> new MarketplaceBlockedProfileResponse(
                b.getId(),
                b.getBlockedProfile().getId(),
                b.getBlockedProfile().getDisplayName(),
                b.getBlockedProfile().getProfileImage(),
                b.getCreatedAt() != null ? b.getCreatedAt().toString() : ""
        )).toList();
    }

    public MarketplaceBlockStatusResponse getBlockStatus(Long myProfileId, Long targetProfileId) {
        if (myProfileId == null || targetProfileId == null) {
            return new MarketplaceBlockStatusResponse(false, false, false);
        }
        boolean blockedByMe = blockRepository.existsByBlockerProfileIdAndBlockedProfileId(myProfileId, targetProfileId);
        boolean blockedByThem = blockRepository.existsByBlockerProfileIdAndBlockedProfileId(targetProfileId, myProfileId);
        return new MarketplaceBlockStatusResponse(blockedByMe, blockedByThem, blockedByMe || blockedByThem);
    }

    public boolean isBlockedEitherWay(Long profileId1, Long profileId2) {
        if (profileId1 == null || profileId2 == null) {
            return false;
        }
        return blockRepository.isBlockedEitherWay(profileId1, profileId2);
    }

    // Convenience methods mapping from userId
    @Transactional
    public MarketplaceBlockedProfileResponse blockByUserId(Long blockerUserId, Long targetProfileId) {
        MarketplaceProfile blocker = profileRepository.findByUserId(blockerUserId)
                .orElseThrow(() -> new RuntimeException("Marketplace profile for user " + blockerUserId + " not found"));
        return blockProfile(blocker.getId(), targetProfileId);
    }

    @Transactional
    public void unblockByUserId(Long blockerUserId, Long targetProfileId) {
        MarketplaceProfile blocker = profileRepository.findByUserId(blockerUserId)
                .orElseThrow(() -> new RuntimeException("Marketplace profile for user " + blockerUserId + " not found"));
        unblockProfile(blocker.getId(), targetProfileId);
    }

    public List<MarketplaceBlockedProfileResponse> getBlockedProfilesByUserId(Long blockerUserId) {
        MarketplaceProfile blocker = profileRepository.findByUserId(blockerUserId).orElse(null);
        if (blocker == null) return Collections.emptyList();
        return getBlockedProfiles(blocker.getId());
    }

    public MarketplaceBlockStatusResponse getBlockStatusByUserId(Long myUserId, Long targetProfileId) {
        MarketplaceProfile myProfile = profileRepository.findByUserId(myUserId).orElse(null);
        if (myProfile == null) {
            return new MarketplaceBlockStatusResponse(false, false, false);
        }
        return getBlockStatus(myProfile.getId(), targetProfileId);
    }
}
