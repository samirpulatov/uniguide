package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.Guide;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.GuideCategory;
import com.samir.uniguide.model.enums.GuideStatus;

import com.samir.uniguide.model.enums.University;
import org.springframework.data.jpa.domain.Specification;

public class GuideSpecification {
    public static Specification<Guide> hasStatus(GuideStatus status) {
        return (root, query, cb) -> cb.equal(root.get("guideStatus"), status);
    }

    public static Specification<Guide> hasCity(City city) {
        return (root, query, cb) ->
                city == null ? null : cb.equal(root.get("city"), city);
    }

    public static Specification<Guide> hasUniversity(University university) {
        return (root, query, cb) ->
                university == null ? null : cb.equal(root.get("university"), university);
    }

    public static Specification<Guide> hasCategory(GuideCategory category) {
        return (root, query, cb) ->
                category == null ? null : cb.equal(root.get("category"), category);
    }


}
