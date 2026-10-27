package com.samir.uniguide.dto.request;


import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Body of POST /housing and PUT /housing/{id}. One DTO for both, because PUT replaces
 * the whole listing. {@code @Digits(8, 2)} matches the {@code NUMERIC(10,2)} columns,
 * so too large values give 400 instead of a database error.
 */
@Data
public class HousingRequest {
    @NotNull
    private HouseType houseType;

    @NotBlank
    @Size(max = 100)
    private String title;

    @NotNull
    @Positive
    @Digits(integer = 8, fraction = 2)
    private BigDecimal coldRent;

    @NotNull
    @Positive
    @Digits(integer = 8, fraction = 2)
    private BigDecimal warmRent;

    @NotNull
    @Positive
    @Digits(integer = 8, fraction = 2)
    private BigDecimal area;

    @PositiveOrZero
    @Digits(integer = 8, fraction = 2)
    private BigDecimal deposit;

    @NotNull
    private City city;

    // German postcodes have exactly 5 digits; a String, because they can start with 0
    @NotBlank
    @Pattern(regexp = "\\d{5}")
    private String postCode;

    @NotBlank
    @Size(max = 100)
    private String street;

    @NotBlank
    private String content;

}
