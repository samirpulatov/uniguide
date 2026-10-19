package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.JobType;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Body of POST /jobs and PUT /jobs/{id}. One DTO for both, because PUT replaces the whole vacancy.
 * {@code @Digits(3, 2)} matches the {@code NUMERIC(5,2)} column, so too large wages give 400
 * instead of a database error.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobVacancyRequest {
    @NotBlank
    @Size(min = 10, max = 100)
    private String title;
    @NotNull
    private City city;
    @NotNull
    private JobType jobType;

    @NotNull
    @PositiveOrZero
    @Digits(integer = 3, fraction = 2)
    private BigDecimal salaryPerHour;
    @NotBlank
    @Size(min = 10, max = 2000)
    private String description;
    @NotBlank
    @Size(min = 1, max = 100)
    private String company;
}
