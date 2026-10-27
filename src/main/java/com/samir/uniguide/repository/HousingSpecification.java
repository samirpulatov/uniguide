package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

/**
 * Filter parts for GET /housing, combined in {@code HousingService.getAllHousings}.
 * Every method returns a {@code null} predicate when its value is {@code null};
 * Spring Data skips such predicates, so an unset filter field simply does not filter.
 */
public class HousingSpecification {

    public static Specification<Housing> hasCity(City city) {
        return (root, criteriaQuery, criteriaBuilder) ->
                city == null ? null : criteriaBuilder.equal(root.get("city"), city);
    }

    public static Specification<Housing> hasHouseType(HouseType houseType) {
        return (root, criteriaQuery, criteriaBuilder) ->
                houseType == null ? null : criteriaBuilder.equal(root.get("houseType"), houseType);
    }

    public static Specification<Housing> hasMaxWarmRent(BigDecimal maxWarmRent) {
        return (root, criteriaQuery, criteriaBuilder) ->
                maxWarmRent == null ? null : criteriaBuilder.lessThanOrEqualTo(root.get("warmRent"), maxWarmRent);
    }

    public static Specification<Housing> hasMinWarmRent(BigDecimal minWarmRent) {
        return (root, criteriaQuery, criteriaBuilder) ->
                minWarmRent == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get("warmRent"), minWarmRent);
    }

    public static Specification<Housing> hasMinArea(BigDecimal minArea) {
        return (root, criteriaQuery, criteriaBuilder) ->
                minArea == null ? null : criteriaBuilder.greaterThanOrEqualTo(root.get("area"), minArea);
    }

    // exclusive (<) on purpose, unlike the other bounds: area buckets in the UI (<50 / 50–100 / ≥100)
    // must not overlap, so a 50 m² flat is not in "<50"
    public static Specification<Housing> hasMaxArea(BigDecimal maxArea) {
        return (root, criteriaQuery, criteriaBuilder) ->
                maxArea == null ? null : criteriaBuilder.lessThan(root.get("area"), maxArea);
    }


}
