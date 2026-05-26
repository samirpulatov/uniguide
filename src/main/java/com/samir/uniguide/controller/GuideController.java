package com.samir.uniguide.controller;

import com.samir.uniguide.dto.request.GuideCreationRequest;
import com.samir.uniguide.dto.response.GuideCreationResponse;
import com.samir.uniguide.service.GuideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Guides", description = "Create, get, update and delete guides")
@RestController
@RequestMapping("/guides")
public class GuideController {
    private final GuideService guideService;

    public GuideController(GuideService guideService) {
        this.guideService = guideService;
    }

    @Operation(summary = "Get all guides")
    @GetMapping
    public ResponseEntity<List<GuideCreationResponse>> getAllGuides() {
        return ResponseEntity.ok(guideService.getAllGuides());
    }

    @Operation(summary = "Get a guide by ID")
    @GetMapping("/{id}")
    public ResponseEntity<GuideCreationResponse> getGuideById(@PathVariable Long id) {
        return ResponseEntity.ok(guideService.getGuideById(id));
    }

    @Operation(summary = "Create a new guide",security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<GuideCreationResponse> createGuide(
            @Valid @RequestBody GuideCreationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.status(201).body(guideService.createGuide(request, authentication.getName()));
    }

    @Operation(summary = "Update an existing guide",security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public ResponseEntity<GuideCreationResponse> updateGuide(
            @PathVariable Long id,
            @Valid @RequestBody GuideCreationRequest request,
            Authentication authentication
    ) {
        return ResponseEntity.ok(guideService.updateGuide(id, request, authentication.getName()));
    }

    @Operation(summary = "Delete a guide by ID",security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGuide(@PathVariable Long id, Authentication authentication) {
        guideService.deleteGuide(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
