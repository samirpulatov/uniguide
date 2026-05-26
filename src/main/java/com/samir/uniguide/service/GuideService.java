package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.GuideCreationRequest;
import com.samir.uniguide.dto.response.GuideCreationResponse;
import com.samir.uniguide.model.entity.Guide;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.GuideRepository;
import com.samir.uniguide.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GuideService {
    private final GuideRepository guideRepository;
    private final UserRepository userRepository;

    public GuideService(GuideRepository guideRepository, UserRepository userRepository) {
        this.guideRepository = guideRepository;
        this.userRepository = userRepository;
    }

    public GuideCreationResponse createGuide(GuideCreationRequest request, String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new RuntimeException("User not found"));

        Guide guide = Guide.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .author(user)
                .guideCategory(request.getGuideCategory())
                .build();

        Guide savedGuide = guideRepository.save(guide);
        return toResponse(savedGuide);

    }

    public List<GuideCreationResponse> getAllGuides() {
        return guideRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public GuideCreationResponse getGuideById(Long id) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new RuntimeException("Guide not found"));
        return toResponse(guide);
    }

    public GuideCreationResponse updateGuide(Long id, GuideCreationRequest request, String username) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new RuntimeException("Guide not found"));
        if(!guide.getAuthor().getUsername().equals(username)) {
            throw new RuntimeException("Access denied: You are not the author of this guide");
        }

        guide.setTitle(request.getTitle());
        guide.setContent(request.getContent());
        guide.setGuideCategory(request.getGuideCategory());

        Guide savedGuide = guideRepository.save(guide);
        return toResponse(savedGuide);

    }

    public void deleteGuide(Long id,String username) {
        Guide guide = guideRepository.findById(id).orElseThrow(() -> new RuntimeException("Guide not found"));
        if(!guide.getAuthor().getUsername().equals(username)) {
            throw new RuntimeException("Access denied: You are not the author of this guide");
        }
        guideRepository.delete(guide);
    }

    private GuideCreationResponse toResponse(Guide guide) {
        return GuideCreationResponse.builder()
                .id(guide.getId())
                .title(guide.getTitle())
                .content(guide.getContent())
                .category(guide.getGuideCategory())
                .authorName(guide.getAuthor().getUsername())
                .createdAt(guide.getCreatedAt())
                .updatedAt(guide.getUpdatedAt())
                .build();
    }
}
