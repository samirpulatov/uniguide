package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.JobVacancy;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface JobVacancyRepository extends JpaRepository<JobVacancy, Long>, JpaSpecificationExecutor<JobVacancy> {
    // filters + ORDER BY in one SELECT; the entity graph loads the LAZY author in the same query (no N+1)
    @Override
    @EntityGraph(attributePaths = "author")
    List<JobVacancy> findAll(Specification<JobVacancy> spec, Sort sort);

    List<JobVacancy> getJobVacanciesByAuthorOrderByCreatedAtDesc(User author);
}
