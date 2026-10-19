package com.samir.uniguide.controller;

import com.samir.uniguide.dto.request.JobVacancyFilter;
import com.samir.uniguide.dto.request.JobVacancyRequest;
import com.samir.uniguide.dto.response.JobVacancyResponse;
import com.samir.uniguide.service.JobVacancyService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints of the Jobbörse. Reading vacancies is public (like guides), everything else
 * requires login (see SecurityConfig). The current user is taken from {@link Authentication},
 * i.e. from the JWT, never from the URL. Business rules (ownership, 403/404) live in {@link JobVacancyService}.
 */
@Tag(name = "Jobs", description = "Create, update, and delete job vacancies")
@RestController
@RequestMapping("/jobs")
public class JobVacancyController {
    private final JobVacancyService jobVacancyService;

    public JobVacancyController(JobVacancyService jobVacancyService) {
        this.jobVacancyService = jobVacancyService;
    }

    @Operation(summary = "Create job vacancy", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping
    public ResponseEntity<JobVacancyResponse> createJobVacancy(@Valid @RequestBody JobVacancyRequest jobVacancyRequest, Authentication authentication) {
        return ResponseEntity.status(201).body(jobVacancyService.createJobVacancy(jobVacancyRequest, authentication.getName()));
    }

    @Operation(summary = "Update job vacancy", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/{id}")
    public ResponseEntity<JobVacancyResponse> updateJobVacancy(@PathVariable Long id, @Valid @RequestBody JobVacancyRequest jobVacancyRequest, Authentication authentication) {
        return ResponseEntity.ok(jobVacancyService.updateJobVacancy(id, jobVacancyRequest, authentication.getName()));
    }

    @Operation(summary = "Get job vacancy by id")
    @GetMapping("/{id}")
    public ResponseEntity<JobVacancyResponse> getJobVacancyById(@PathVariable Long id) {
        return ResponseEntity.ok(jobVacancyService.getJobVacancyById(id));
    }

    // "/me" is matched before "/{id}", because Spring prefers literal paths over path variables
    @Operation(summary = "Get my job vacancies", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public ResponseEntity<List<JobVacancyResponse>> getMyJobVacancies(Authentication authentication) {
        return ResponseEntity.ok(jobVacancyService.getMyJobVacancies(authentication.getName()));
    }

    // @ModelAttribute binds query params (?city=...&jobType=...&minSalaryPerHour=...) to JobVacancyFilter; @Valid checks them
    @Operation(summary = "Get all job vacancies")
    @GetMapping
    public ResponseEntity<List<JobVacancyResponse>> getAllJobVacancies(@ModelAttribute @Valid JobVacancyFilter filter) {
        return ResponseEntity.ok(jobVacancyService.getAllJobVacancies(filter));
    }

    @Operation(summary = "Delete job vacancy", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobVacancy(@PathVariable Long id, Authentication authentication) {
        jobVacancyService.deleteJobVacancy(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
