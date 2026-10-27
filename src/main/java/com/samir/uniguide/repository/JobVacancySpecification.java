package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.JobVacancy;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.JobType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

/**
 * Building blocks for the dynamic filter of GET /jobs. Each method returns a null predicate
 * when its value is null, so the filter is skipped (see {@code JobVacancyService.getAllJobVacancies}).
 */
public class JobVacancySpecification {
    public static Specification<JobVacancy> hasCity(City city) {
        return (root, criteriaQuery, criteriaBuilder) ->
                city == null ? null : criteriaBuilder.equal(root.get("city"), city);
    }

    public static Specification<JobVacancy> hasJobType(JobType jobType) {
        return (root, criteriaQuery, criteriaBuilder) ->
                jobType == null ? null : criteriaBuilder.equal(root.get("jobType"), jobType);
    }

    public static Specification<JobVacancy> hasMinSalaryPerHour(BigDecimal minSalaryPerHour) {
        return (root, criteriaQuery, criteriaBuilder) ->
                minSalaryPerHour == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get("salaryPerHour"), minSalaryPerHour);
    }
}
