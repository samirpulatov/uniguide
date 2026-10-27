package com.samir.uniguide.dto.request;


import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.JobType;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Query parameters of GET /jobs, bound with {@code @ModelAttribute}. All fields are optional;
 * a missing field means "do not filter by it". {@code minSalaryPerHour} is inclusive.
 */
@Getter
@Setter
public class JobVacancyFilter {
    private City city;
    @PositiveOrZero
    private BigDecimal minSalaryPerHour;
    private JobType jobType;
}
