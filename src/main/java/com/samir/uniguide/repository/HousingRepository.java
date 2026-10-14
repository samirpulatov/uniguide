package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

/**
 * Database access for housing listings.
 * {@link JpaSpecificationExecutor} allows dynamic filters built in {@link HousingSpecification}.
 */
public interface HousingRepository extends JpaRepository<Housing, Long>, JpaSpecificationExecutor<Housing> {
    /** Returns all listings of one user (for GET /housing/me). */
    List<Housing> getHousingsByAuthor(User author);

    /**
     * Same as the inherited method, but loads the LAZY {@code author} in the same SELECT (JOIN).
     * Without it, mapping to {@code HousingResponse} would run one extra query per listing (N+1).
     */
    @Override
    @EntityGraph(attributePaths = "author")
    List<Housing> findAll(Specification<Housing> spec);


}
