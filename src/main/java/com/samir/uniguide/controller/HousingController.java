package com.samir.uniguide.controller;

import com.samir.uniguide.dto.request.HousingFilter;
import com.samir.uniguide.dto.request.HousingRequest;
import com.samir.uniguide.dto.response.HousingResponse;
import com.samir.uniguide.service.HousingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for housing listings. Every endpoint requires login (see SecurityConfig).
 * The current user is taken from {@link Authentication}, i.e. from the JWT, never from the URL.
 * Business rules (ownership, 403/404) live in {@link HousingService}.
 */
@Tag(name = "Housing", description = "Create, update, and delete housings")
@RestController
@RequestMapping("/housing")
public class HousingController {
    private final HousingService housingService;

    public HousingController(HousingService housingService) {
        this.housingService = housingService;
    }

    @Operation(summary = "Create housing", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<HousingResponse> createHousing(@Valid @RequestBody HousingRequest housingRequest, Authentication authentication) {
        return ResponseEntity.status(201).body(housingService.createHousing(housingRequest, authentication.getName()));
    }

    @Operation(summary = "Update housing", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public ResponseEntity<HousingResponse> updateHousing(@PathVariable Long id, @Valid @RequestBody HousingRequest housingRequest, Authentication authentication) {
        return ResponseEntity.ok().body(housingService.updateHousing(id, housingRequest, authentication.getName()));
    }

    @Operation(summary = "Get housing by id", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/{id}")
    public ResponseEntity<HousingResponse> getHousingById(@PathVariable Long id) {
        return  ResponseEntity.ok(housingService.getHousingById(id));
    }

    // "/me" is matched before "/{id}", because Spring prefers literal paths over path variables
    @Operation(summary = "Get housings", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public ResponseEntity<List<HousingResponse>> getMyHousings(Authentication authentication) {
        return ResponseEntity.ok(housingService.getMyHousings(authentication.getName()));
    }

    @Operation(summary = "Get all housings", security = @SecurityRequirement(name = "bearerAuth"))
    // @ModelAttribute binds query params (?city=...&maxWarmRent=...) to HousingFilter; @Valid checks them
    @GetMapping
    public ResponseEntity<List<HousingResponse>> getAllHousings(@ModelAttribute @Valid HousingFilter filter, Authentication authentication) {
        return ResponseEntity.ok(housingService.getAllHousings(filter));
    }

    @Operation(summary = "Delete housing", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHousing(@PathVariable Long id, Authentication authentication) {
        housingService.deleteHousing(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }


}
