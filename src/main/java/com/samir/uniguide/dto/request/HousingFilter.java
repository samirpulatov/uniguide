package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * Query parameters of GET /housing, bound with {@code @ModelAttribute}. All fields are optional;
 * a missing field means "do not filter by it". Rent bounds are inclusive,
 * {@code minArea} is inclusive and {@code maxArea} is exclusive (see {@code HousingSpecification}).
 */
@Setter
@Getter
public class HousingFilter {
    private City city;
    private HouseType houseType;
    @PositiveOrZero
    private BigDecimal maxWarmRent;
    @PositiveOrZero
    private BigDecimal minWarmRent;
    @PositiveOrZero
    private BigDecimal minArea;
    @PositiveOrZero
    private BigDecimal maxArea;
}
