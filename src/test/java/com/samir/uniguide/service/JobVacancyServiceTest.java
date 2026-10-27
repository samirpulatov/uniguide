package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.JobVacancyFilter;
import com.samir.uniguide.dto.request.JobVacancyRequest;
import com.samir.uniguide.dto.response.JobVacancyResponse;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.JobVacancy;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.JobType;
import com.samir.uniguide.repository.JobVacancyRepository;
import com.samir.uniguide.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class JobVacancyServiceTest {
    private static final String AUTHOR = "author";
    private static final String STRANGER = "stranger";

    @Mock
    private JobVacancyRepository jobVacancyRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private JobVacancyService jobVacancyService;

    // ---------- helpers ----------

    // the ownership check compares ids, so every user needs one
    private User buildUser(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        return user;
    }

    private JobVacancy buildJobVacancy(Long id, User author, String title) {
        return JobVacancy.builder()
                .id(id)
                .title(title)
                .company("Test GmbH")
                .city(City.SIEGEN)
                .jobType(JobType.MINIJOB)
                .salaryPerHour(new BigDecimal("12.82"))
                .description("Help in the warehouse, 10 hours a week")
                .author(author)
                .build();
    }

    private JobVacancyRequest buildRequest() {
        return JobVacancyRequest.builder()
                .title("Werkstudent in IT support")
                .company("Uni Siegen")
                .city(City.BOCHUM)
                .jobType(JobType.WERKSTUDENT)
                .salaryPerHour(new BigDecimal("17.00"))
                .description("First-level support for students and staff")
                .build();
    }

    // ---------- createJobVacancy ----------

    @Test
    @DisplayName("createJobVacancy saves a vacancy owned by the current user with every field from the request")
    void createJobVacancy_savesVacancyForCurrentUser() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(jobVacancyRepository.save(any(JobVacancy.class))).thenAnswer(invocation -> {
            JobVacancy saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        //Act
        JobVacancyResponse result = jobVacancyService.createJobVacancy(buildRequest(), AUTHOR);

        //Assert
        // check what actually went to the DB, not only the response
        ArgumentCaptor<JobVacancy> captor = ArgumentCaptor.forClass(JobVacancy.class);
        verify(jobVacancyRepository).save(captor.capture());
        JobVacancy saved = captor.getValue();
        assertSame(author, saved.getAuthor());
        assertEquals("Werkstudent in IT support", saved.getTitle());
        assertEquals("Uni Siegen", saved.getCompany());
        assertEquals(City.BOCHUM, saved.getCity());
        assertEquals(JobType.WERKSTUDENT, saved.getJobType());
        assertEquals(new BigDecimal("17.00"), saved.getSalaryPerHour());
        assertEquals("First-level support for students and staff", saved.getDescription());

        assertEquals(1L, result.getId());
        assertEquals("Werkstudent in IT support", result.getTitle());
        assertEquals(AUTHOR, result.getAuthorName());
    }

    @Test
    @DisplayName("createJobVacancy accepts 0 €/h for an unpaid internship")
    void createJobVacancy_unpaid_savesZero() {
        //Arrange
        JobVacancyRequest request = buildRequest();
        request.setJobType(JobType.PRAKTIKUM);
        request.setSalaryPerHour(BigDecimal.ZERO);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(buildUser(AUTHOR)));
        when(jobVacancyRepository.save(any(JobVacancy.class))).thenAnswer(invocation -> invocation.getArgument(0));

        //Act
        JobVacancyResponse result = jobVacancyService.createJobVacancy(request, AUTHOR);

        //Assert
        assertEquals(BigDecimal.ZERO, result.getSalaryPerHour());
    }

    @Test
    @DisplayName("createJobVacancy throws 404 and saves nothing when the user from the token does not exist")
    void createJobVacancy_unknownUser_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> jobVacancyService.createJobVacancy(buildRequest(), AUTHOR));

        verify(jobVacancyRepository, never()).save(any(JobVacancy.class));
    }

    // ---------- getJobVacancyById ----------

    @Test
    @DisplayName("getJobVacancyById maps an existing vacancy to a response")
    void getJobVacancyById_found_returnsResponse() {
        //Arrange
        when(jobVacancyRepository.findById(1L)).thenReturn(Optional.of(buildJobVacancy(1L, buildUser(AUTHOR), "Minijob")));

        //Act
        JobVacancyResponse result = jobVacancyService.getJobVacancyById(1L);

        //Assert
        assertEquals(1L, result.getId());
        assertEquals("Minijob", result.getTitle());
        assertEquals("Test GmbH", result.getCompany());
        assertEquals(JobType.MINIJOB, result.getJobType());
        assertEquals(new BigDecimal("12.82"), result.getSalaryPerHour());
        assertEquals(AUTHOR, result.getAuthorName());
    }

    @Test
    @DisplayName("getJobVacancyById throws 404 when the vacancy does not exist")
    void getJobVacancyById_missing_throwsNotFound() {
        //Arrange
        when(jobVacancyRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> jobVacancyService.getJobVacancyById(99L));
    }

    // ---------- getMyJobVacancies ----------

    @Test
    @DisplayName("getMyJobVacancies maps the user's vacancies to responses in repository order")
    void getMyJobVacancies_returnsMappedVacancies() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(jobVacancyRepository.getJobVacanciesByAuthorOrderByCreatedAtDesc(author)).thenReturn(List.of(
                buildJobVacancy(2L, author, "newer"),
                buildJobVacancy(1L, author, "older")));

        //Act
        List<JobVacancyResponse> result = jobVacancyService.getMyJobVacancies(AUTHOR);

        //Assert
        assertEquals(2, result.size());
        assertEquals("newer", result.get(0).getTitle());
        assertEquals("older", result.get(1).getTitle());
    }

    @Test
    @DisplayName("getMyJobVacancies returns an empty list when the user has no vacancies")
    void getMyJobVacancies_noVacancies_returnsEmptyList() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(jobVacancyRepository.getJobVacanciesByAuthorOrderByCreatedAtDesc(author)).thenReturn(List.of());

        //Act
        List<JobVacancyResponse> result = jobVacancyService.getMyJobVacancies(AUTHOR);

        //Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getMyJobVacancies throws 404 when the user from the token does not exist")
    void getMyJobVacancies_unknownUser_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> jobVacancyService.getMyJobVacancies(AUTHOR));
    }

    // ---------- getAllJobVacancies ----------

    // the predicates of JobVacancySpecification need a real DB (Criteria API), so here we only check
    // that a Specification and the sort order reach the repository and the results are mapped
    @Test
    @DisplayName("getAllJobVacancies asks the repository for newest first and maps the results")
    @SuppressWarnings("unchecked")
    void getAllJobVacancies_withFilter_sortsNewestFirstAndMaps() {
        //Arrange
        User author = buildUser(AUTHOR);
        JobVacancyFilter filter = new JobVacancyFilter();
        filter.setCity(City.SIEGEN);
        filter.setJobType(JobType.MINIJOB);
        filter.setMinSalaryPerHour(new BigDecimal("12"));
        when(jobVacancyRepository.findAll(any(Specification.class), any(Sort.class)))
                .thenReturn(List.of(buildJobVacancy(1L, author, "Minijob")));

        //Act
        List<JobVacancyResponse> result = jobVacancyService.getAllJobVacancies(filter);

        //Assert
        ArgumentCaptor<Sort> sortCaptor = ArgumentCaptor.forClass(Sort.class);
        verify(jobVacancyRepository).findAll(any(Specification.class), sortCaptor.capture());
        assertEquals(Sort.by(Sort.Direction.DESC, "createdAt"), sortCaptor.getValue());

        assertEquals(1, result.size());
        assertEquals("Minijob", result.getFirst().getTitle());
        assertEquals(AUTHOR, result.getFirst().getAuthorName());
    }

    @Test
    @DisplayName("getAllJobVacancies with an empty filter still works and returns everything the repository finds")
    @SuppressWarnings("unchecked")
    void getAllJobVacancies_emptyFilter_returnsAll() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(jobVacancyRepository.findAll(any(Specification.class), any(Sort.class))).thenReturn(List.of(
                buildJobVacancy(1L, author, "first"),
                buildJobVacancy(2L, author, "second")));

        //Act
        List<JobVacancyResponse> result = jobVacancyService.getAllJobVacancies(new JobVacancyFilter());

        //Assert
        assertEquals(2, result.size());
    }

    // ---------- updateJobVacancy ----------

    @Test
    @DisplayName("updateJobVacancy replaces every field of the owner's vacancy")
    void updateJobVacancy_owner_replacesAllFields() {
        //Arrange
        User author = buildUser(AUTHOR);
        JobVacancy jobVacancy = buildJobVacancy(1L, author, "old title");
        when(jobVacancyRepository.findById(1L)).thenReturn(Optional.of(jobVacancy));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(jobVacancyRepository.save(jobVacancy)).thenReturn(jobVacancy);

        //Act
        JobVacancyResponse result = jobVacancyService.updateJobVacancy(1L, buildRequest(), AUTHOR);

        //Assert
        ArgumentCaptor<JobVacancy> captor = ArgumentCaptor.forClass(JobVacancy.class);
        verify(jobVacancyRepository).save(captor.capture());
        JobVacancy saved = captor.getValue();
        assertEquals(1L, saved.getId());
        assertSame(author, saved.getAuthor());
        assertEquals("Werkstudent in IT support", saved.getTitle());
        assertEquals("Uni Siegen", saved.getCompany());
        assertEquals(City.BOCHUM, saved.getCity());
        assertEquals(JobType.WERKSTUDENT, saved.getJobType());
        assertEquals(new BigDecimal("17.00"), saved.getSalaryPerHour());
        assertEquals("First-level support for students and staff", saved.getDescription());

        assertEquals("Werkstudent in IT support", result.getTitle());
        assertEquals(AUTHOR, result.getAuthorName());
    }

    @Test
    @DisplayName("updateJobVacancy throws 403 and saves nothing when the vacancy belongs to another user")
    void updateJobVacancy_notOwner_throwsForbidden() {
        //Arrange
        JobVacancy jobVacancy = buildJobVacancy(1L, buildUser(AUTHOR), "Minijob");
        when(jobVacancyRepository.findById(1L)).thenReturn(Optional.of(jobVacancy));
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(buildUser(STRANGER)));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> jobVacancyService.updateJobVacancy(1L, buildRequest(), STRANGER));

        assertEquals("Minijob", jobVacancy.getTitle());
        verify(jobVacancyRepository, never()).save(any(JobVacancy.class));
    }

    // getOwnedJobVacancy looks up the vacancy first, so the user is never loaded here
    @Test
    @DisplayName("updateJobVacancy throws 404 and saves nothing when the vacancy does not exist")
    void updateJobVacancy_missingVacancy_throwsNotFound() {
        //Arrange
        when(jobVacancyRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> jobVacancyService.updateJobVacancy(99L, buildRequest(), AUTHOR));

        verify(jobVacancyRepository, never()).save(any(JobVacancy.class));
    }

    // ---------- deleteJobVacancy ----------

    @Test
    @DisplayName("deleteJobVacancy deletes the owner's vacancy")
    void deleteJobVacancy_owner_deletes() {
        //Arrange
        User author = buildUser(AUTHOR);
        JobVacancy jobVacancy = buildJobVacancy(1L, author, "Minijob");
        when(jobVacancyRepository.findById(1L)).thenReturn(Optional.of(jobVacancy));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));

        //Act
        jobVacancyService.deleteJobVacancy(1L, AUTHOR);

        //Assert
        verify(jobVacancyRepository).delete(jobVacancy);
    }

    @Test
    @DisplayName("deleteJobVacancy throws 403 and deletes nothing when the vacancy belongs to another user")
    void deleteJobVacancy_notOwner_throwsForbidden() {
        //Arrange
        when(jobVacancyRepository.findById(1L)).thenReturn(Optional.of(buildJobVacancy(1L, buildUser(AUTHOR), "Minijob")));
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(buildUser(STRANGER)));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> jobVacancyService.deleteJobVacancy(1L, STRANGER));

        verify(jobVacancyRepository, never()).delete(any(JobVacancy.class));
    }

    @Test
    @DisplayName("deleteJobVacancy throws 404 and deletes nothing when the vacancy does not exist")
    void deleteJobVacancy_missingVacancy_throwsNotFound() {
        //Arrange
        when(jobVacancyRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> jobVacancyService.deleteJobVacancy(99L, AUTHOR));

        verify(jobVacancyRepository, never()).delete(any(JobVacancy.class));
    }
}
