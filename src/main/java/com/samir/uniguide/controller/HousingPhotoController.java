package com.samir.uniguide.controller;

import com.samir.uniguide.dto.response.HousingPhotoResponse;
import com.samir.uniguide.service.HousingPhotoDetails;
import com.samir.uniguide.service.HousingPhotoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

/**
 * REST endpoints for photos of housing listings. Every endpoint requires login (see SecurityConfig).
 * Photos are a nested resource of a listing ({@code /housing/{housingId}/photos}); only the image
 * bytes are served by photo id alone, because the photo id is unique on its own.
 * Business rules (ownership, file validation, 403/404) live in {@link HousingPhotoService}.
 */
@Tag(name = "HousingPhoto", description = "Store, load and delete photos")
@RestController
@RequestMapping("/housing")
public class HousingPhotoController {
    private final HousingPhotoService housingPhotoService;

    public HousingPhotoController(HousingPhotoService housingPhotoService) {
        this.housingPhotoService = housingPhotoService;
    }

    @Operation(summary = "Upload photo", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping(value = "/{housingId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<HousingPhotoResponse> storeHousingPhoto(Authentication authentication, @PathVariable Long housingId, @RequestParam MultipartFile file) {
        HousingPhotoResponse response = housingPhotoService.storeHousingPhoto(authentication.getName(), housingId, file);
        return ResponseEntity.status(201).body(response);
    }

    @Operation(summary = "Get photos of housing", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{housingId}/photos")
    public ResponseEntity<List<HousingPhotoResponse>> loadHousingPhotos(@PathVariable Long housingId) {
        return ResponseEntity.ok(housingPhotoService.loadHousingPhotos(housingId));
    }

    // returns the image itself, not JSON; Content-Type is the one saved at upload time
    @Operation(summary = "Get photo image", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/photos/{photoId}")
    public ResponseEntity<Resource> loadHousingPhotoData(@PathVariable UUID photoId) {
        HousingPhotoDetails housingPhotoDetails = housingPhotoService.loadHousingPhotoData(photoId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(housingPhotoDetails.contentType()))
                .body(housingPhotoDetails.resource());
    }

    @Operation(summary = "Delete photo", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{housingId}/photos/{photoId}")
    public ResponseEntity<Void> deleteHousingPhoto(Authentication authentication, @PathVariable Long housingId, @PathVariable UUID photoId) {
        housingPhotoService.deleteHousingPhoto(authentication.getName(), housingId, photoId);
        return ResponseEntity.noContent().build();
    }
}
