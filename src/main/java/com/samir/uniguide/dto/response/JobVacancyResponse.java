package com.samir.uniguide.dto.response;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.JobType;
import lombok.*;

import java.math.BigDecimal;

import java.time.LocalDateTime;

/**
 * A job vacancy as sent to the client, used for both the list and the detail view.
 * The author is only a username ({@code authorName}), the {@code User} entity is never exposed.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobVacancyResponse {
    private Long id;
    private String title;
    private City city;
    private JobType jobType;
    private String company;
    private BigDecimal salaryPerHour;
    private String description;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String authorName;

}
