package com.samir.uniguide.controller;


import com.samir.uniguide.dto.request.GuideReviewRequest;
import com.samir.uniguide.dto.response.GuideCreationResponse;
import com.samir.uniguide.service.GuideService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag( name = "Admin", description = "Admin API")
@RestController
@AllArgsConstructor
@RequestMapping("/admin")
public class AdminController {
    private final GuideService guideService;

    @Operation(summary = "get all guides",security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/guides")
    public ResponseEntity<List<GuideCreationResponse>> getAllGuides() {
        return ResponseEntity.ok(guideService.getAllGuidesForAdmin());
    }

    @Operation(summary = "review guide", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/guides/{id}/review")
    public ResponseEntity<GuideCreationResponse> reviewGuide(@PathVariable Long id,@Valid @RequestBody GuideReviewRequest request) {
        return ResponseEntity.ok(guideService.reviewGuide(id, request));
    }
}
