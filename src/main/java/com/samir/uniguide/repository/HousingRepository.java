package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface HousingRepository extends JpaRepository<Housing, Long>, JpaSpecificationExecutor<Housing> {
    List<Housing> getHousingsByAuthor(User author);

    @Override
    @EntityGraph(attributePaths = "author")
    List<Housing> findAll(Specification<Housing> spec);


}
