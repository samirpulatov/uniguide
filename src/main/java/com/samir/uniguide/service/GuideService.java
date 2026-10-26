package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.GuideCreationRequest;
import com.samir.uniguide.dto.request.GuideReviewRequest;
import com.samir.uniguide.dto.response.GuideCreationResponse;
import com.samir.uniguide.exception.BadRequestException;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.Guide;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.model.enums.*;
import com.samir.uniguide.repository.GuideRepository;
import com.samir.uniguide.repository.GuideSpecification;
import com.samir.uniguide.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Guides written by users plus the admin moderation flow.
 * A new or edited guide is PENDING until an admin approves or rejects it;
 * the public list GET /guides only ever returns APPROVED guides.
 * The username always comes from the JWT (the controller passes {@code authentication.getName()}),
 * never from the URL or the request body.
 */
@Service
public class GuideService {
    private final GuideRepository guideRepository;
    private final UserRepository userRepository;

    public GuideService(GuideRepository guideRepository, UserRepository userRepository) {
        this.guideRepository = guideRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new guide for the current user.
     * {@code guideStatus} starts as PENDING ({@code @Builder.Default} in Guide), so the guide
     * is not public until an admin approves it.
     *
     * @param request  guide data (already validated)
     * @param username current user from the JWT
     * @return the saved guide
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public GuideCreationResponse createGuide(GuideCreationRequest request, String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Guide guide = Guide.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(user)
                .guideCategory(request.getGuideCategory())
                .city(request.getCity())
                .university(request.getUniversity())
                .build();

        Guide savedGuide = guideRepository.save(guide);
        return toResponse(savedGuide);

    }

    /**
     * Public list for GET /guides: only APPROVED guides, optionally filtered.
     * Every filter may be null, which means "do not filter by it".
     *
     * @param city       city filter, or null
     * @param category   category filter, or null
     * @param university university filter, or null
     * @return matching approved guides; an empty list if there are none
     */
    public List<GuideCreationResponse> getAllApprovedGuides(City city, GuideCategory category, University university) {
        // hasStatus is never null, so the APPROVED condition is always in the WHERE;
        // the other filters return a null predicate when not set, which Specification simply skips
        Specification<Guide> approvedSpec = Specification
                .where(GuideSpecification.hasStatus(GuideStatus.APPROVED))
                .and(GuideSpecification.hasCity(city))
                .and(GuideSpecification.hasCategory(category))
                .and(GuideSpecification.hasUniversity(university));

        return guideRepository.findAll(approvedSpec)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * All guides in any status, for the moderation view (GET /admin/guides, ROLE_ADMIN only).
     *
     * @return every guide; an empty list if there are none
     */
    public List<GuideCreationResponse> getAllGuidesForAdmin() {
        return guideRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns one guide by id (backs the public GET /guides/{id}).
     * An APPROVED guide is visible to everyone, guests included; a PENDING or REJECTED guide
     * only to its author and to admins. Everyone else gets 404, not 403, so ids of
     * unpublished guides can't be enumerated.
     *
     * @param id       id of the guide from the URL
     * @param username current user from the JWT, or null for a guest
     * @return the guide
     * @throws ResourceNotFoundException if the guide does not exist or the caller may not see it
     */
    public GuideCreationResponse getGuideById(Long id, String username) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Guide not found"));
        // the common case: published guides need no user lookup at all
        if(guide.getGuideStatus() == GuideStatus.APPROVED) {
            return toResponse(guide);
        }
        // same message as "does not exist", so a guest can't tell an unpublished guide from a missing one
        if(username == null) {
            throw new ResourceNotFoundException("Guide not found");
        }
        if(guide.getAuthor().getUsername().equals(username)) {
            return toResponse(guide);
        }
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if(user.getRole() != Role.ADMIN) {
            throw new ResourceNotFoundException("Guide not found");
        }
        return toResponse(guide);
    }


    /**
     * Returns all guides of the current user in any status (backs GET /guides/me),
     * so the author can see which guides are still PENDING or were REJECTED and why.
     *
     * @param username current user from the JWT
     * @return the user's guides; an empty list if there are none
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public List<GuideCreationResponse> getMyGuides(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<Guide> guides = guideRepository.findByAuthor(user);
        return guides.stream().map(this::toResponse).toList();
    }

    /**
     * Full update (PUT) of an own guide: every field is replaced with the value from the request.
     *
     * @param id       id of the guide from the URL
     * @param request  the complete new guide data
     * @param username current user from the JWT
     * @return the guide after the update, now PENDING again
     * @throws ResourceNotFoundException if the guide does not exist
     * @throws ForbiddenException        if the guide belongs to another user
     */
    public GuideCreationResponse updateGuide(Long id, GuideCreationRequest request, String username)  {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Guide not found"));
        // the real owner is known only from the DB; author is EAGER here, so getUsername() needs no extra query
        if(!guide.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("Access denied: You are not the author of this guide");
        }

        guide.setTitle(request.getTitle());
        guide.setContent(request.getContent());
        guide.setGuideCategory(request.getGuideCategory());
        guide.setCity(request.getCity());
        guide.setUniversity(request.getUniversity());
        // any edit sends the guide back through moderation, even if it was already APPROVED
        guide.setGuideStatus(GuideStatus.PENDING);

        Guide savedGuide = guideRepository.save(guide);
        return toResponse(savedGuide);

    }


    /**
     * Admin moderation (POST /admin/guides/{id}/review): approve or reject a guide.
     * Approving clears an old rejection reason; rejecting requires a reason,
     * so the author knows what to fix.
     *
     * @param id      id of the guide from the URL
     * @param request APPROVED or REJECTED, plus the reason when rejecting
     * @return the guide with its new status
     * @throws ResourceNotFoundException if the guide does not exist
     * @throws BadRequestException       if REJECTED comes without a reason, or the action is PENDING
     */
    public GuideCreationResponse reviewGuide(Long id, GuideReviewRequest request) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Guide not found"));
        if(request.getAction()==GuideStatus.APPROVED) {
            guide.setGuideStatus(GuideStatus.APPROVED);
            // a guide rejected before and then fixed must not keep the old reason
            guide.setRejectionReason(null);
            }
        else if(request.getAction()==GuideStatus.REJECTED) {
                // rejectionReason is only mandatory for this action, so it can't be a @NotBlank on the DTO itself
                if(request.getRejectionReason()==null || request.getRejectionReason().isBlank()) {
                throw new BadRequestException("Rejection reason is required");
            }
            guide.setGuideStatus(GuideStatus.REJECTED);
            guide.setRejectionReason(request.getRejectionReason());
        } else {
            // @NotNull on the DTO already rules out null, so the only value left is PENDING — not a review decision
            throw new BadRequestException("Invalid action");
        }
        Guide savedGuide = guideRepository.save(guide);
        return toResponse(savedGuide);
    }





    /**
     * Deletes an own guide, in any status.
     *
     * @param id       id of the guide from the URL
     * @param username current user from the JWT
     * @throws ResourceNotFoundException if the guide does not exist
     * @throws ForbiddenException        if the guide belongs to another user
     */
    public void deleteGuide(Long id,String username) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Guide not found"));
        if(!guide.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("Access denied: You are not the author of this guide");
        }
        guideRepository.delete(guide);
    }



    // entity -> DTO; status and rejectionReason are included so the author sees why a guide was rejected
    private GuideCreationResponse toResponse(Guide guide) {
        return GuideCreationResponse.builder()
                .id(guide.getId())
                .title(guide.getTitle())
                .content(guide.getContent())
                .category(guide.getGuideCategory())
                .city(guide.getCity())
                .university(guide.getUniversity())
                .authorName(guide.getAuthor().getUsername())
                .createdAt(guide.getCreatedAt())
                .updatedAt(guide.getUpdatedAt())
                .status(guide.getGuideStatus())
                .rejectionReason(guide.getRejectionReason())
                .build();
    }
}
