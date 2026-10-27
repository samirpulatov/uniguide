package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.JobVacancyFilter;
import com.samir.uniguide.dto.request.JobVacancyRequest;
import com.samir.uniguide.dto.response.JobVacancyResponse;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.JobVacancy;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.JobVacancyRepository;
import com.samir.uniguide.repository.JobVacancySpecification;
import com.samir.uniguide.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Job vacancies of the Jobbörse (Minijob, Praktikum, Werkstudent, Teilzeit).
 * Vacancies are not moderated and go live right away. Reading is public, writing requires login
 * (see SecurityConfig). The username always comes from the JWT (the controller passes
 * {@code authentication.getName()}), never from the URL or the request body.
 */
@Service
public class JobVacancyService {
    private final JobVacancyRepository jobVacancyRepository;
    private final UserRepository userRepository;

    public JobVacancyService(JobVacancyRepository jobVacancyRepository, UserRepository userRepository) {
        this.jobVacancyRepository = jobVacancyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new vacancy for the current user.
     * {@code createdAt} / {@code updatedAt} are set by Hibernate on insert.
     *
     * @param jobVacancyRequest vacancy data (already validated)
     * @param username          current user from the JWT
     * @return the saved vacancy
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public JobVacancyResponse createJobVacancy(JobVacancyRequest jobVacancyRequest, String username) {
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));

        JobVacancy jobVacancy = JobVacancy.builder()
                .title(jobVacancyRequest.getTitle())
                .company(jobVacancyRequest.getCompany())
                .city(jobVacancyRequest.getCity())
                .jobType(jobVacancyRequest.getJobType())
                .salaryPerHour(jobVacancyRequest.getSalaryPerHour())
                .description(jobVacancyRequest.getDescription())
                .author(author)
                .build();

        JobVacancy savedJobVacancy = jobVacancyRepository.save(jobVacancy);

        return toJobVacancyResponse(savedJobVacancy);
    }

    /**
     * Full update (PUT) of an own vacancy: every field is replaced with the value from the request.
     *
     * @param id                id of the vacancy from the URL
     * @param jobVacancyRequest the complete new vacancy data
     * @param username          current user from the JWT
     * @return the updated vacancy
     * @throws ResourceNotFoundException if the vacancy does not exist
     * @throws ForbiddenException        if the vacancy belongs to another user
     */
    public JobVacancyResponse updateJobVacancy(Long id, JobVacancyRequest jobVacancyRequest, String username) {
        JobVacancy jobVacancy = getOwnedJobVacancy(id, username);

        jobVacancy.setTitle(jobVacancyRequest.getTitle());
        jobVacancy.setCompany(jobVacancyRequest.getCompany());
        jobVacancy.setCity(jobVacancyRequest.getCity());
        jobVacancy.setJobType(jobVacancyRequest.getJobType());
        jobVacancy.setSalaryPerHour(jobVacancyRequest.getSalaryPerHour());
        jobVacancy.setDescription(jobVacancyRequest.getDescription());

        JobVacancy savedJobVacancy = jobVacancyRepository.save(jobVacancy);

        return toJobVacancyResponse(savedJobVacancy);
    }

    /**
     * Lists all vacancies matching the filter, newest first.
     * Every filter field is optional; a null field is simply not applied.
     *
     * @param jobVacancyFilter city, job type and minimum hourly wage from the query params
     * @return matching vacancies, possibly empty
     */
    public List<JobVacancyResponse> getAllJobVacancies(JobVacancyFilter jobVacancyFilter) {
        // each null filter returns a null predicate, which Specification simply skips
        Specification<JobVacancy> spec = Specification
                .where(JobVacancySpecification.hasCity(jobVacancyFilter.getCity()))
                .and(JobVacancySpecification.hasJobType(jobVacancyFilter.getJobType()))
                .and(JobVacancySpecification.hasMinSalaryPerHour(jobVacancyFilter.getMinSalaryPerHour()));

        // newest first, sorted by the database
        return jobVacancyRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(JobVacancyService::toJobVacancyResponse)
                .toList();
    }

    /**
     * Returns one vacancy (detail page).
     *
     * @param id id of the vacancy
     * @return the vacancy
     * @throws ResourceNotFoundException if the vacancy does not exist
     */
    public JobVacancyResponse getJobVacancyById(Long id) {
        JobVacancy jobVacancy = jobVacancyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("JobVacancy not found"));
        return toJobVacancyResponse(jobVacancy);
    }

    /**
     * Returns all vacancies of the current user, newest first (for GET /jobs/me).
     *
     * @param username current user from the JWT
     * @return own vacancies, possibly empty
     */
    public List<JobVacancyResponse> getMyJobVacancies(String username) {
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return jobVacancyRepository.getJobVacanciesByAuthorOrderByCreatedAtDesc(author).stream().map(JobVacancyService::toJobVacancyResponse).toList();
    }

    /**
     * Deletes an own vacancy. Unlike housing there are no photo files, so a plain delete is enough.
     *
     * @param id       id of the vacancy from the URL
     * @param username current user from the JWT
     * @throws ResourceNotFoundException if the vacancy does not exist
     * @throws ForbiddenException        if the vacancy belongs to another user
     */
    public void deleteJobVacancy(Long id, String username) {
        JobVacancy jobVacancy = getOwnedJobVacancy(id, username);
        jobVacancyRepository.delete(jobVacancy);
    }

    // loads a vacancy and makes sure it belongs to the current user; shared by update and delete,
    // so the ownership check lives in one place. 404 for a missing id, 403 for someone else's vacancy
    private JobVacancy getOwnedJobVacancy(Long id, String username) {
        JobVacancy jobVacancy = jobVacancyRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("JobVacancy not found"));
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // author is LAZY, but getId() on the proxy does not trigger an extra query
        if (!jobVacancy.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("You are not allowed to perform this action");
        }

        return jobVacancy;
    }

    // entity -> DTO; getUsername() reads the LAZY author, so list queries must load authors up front
    private static JobVacancyResponse toJobVacancyResponse(JobVacancy jobVacancy) {

        return JobVacancyResponse.builder()
                .id(jobVacancy.getId())
                .title(jobVacancy.getTitle())
                .company(jobVacancy.getCompany())
                .city(jobVacancy.getCity())
                .jobType(jobVacancy.getJobType())
                .salaryPerHour(jobVacancy.getSalaryPerHour())
                .description(jobVacancy.getDescription())
                .createdAt(jobVacancy.getCreatedAt())
                .updatedAt(jobVacancy.getUpdatedAt())
                .authorName(jobVacancy.getAuthor().getUsername())
                .build();
    }
}
