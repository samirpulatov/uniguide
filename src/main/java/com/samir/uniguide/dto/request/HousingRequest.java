package com.samir.uniguide.dto.request;


import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import jakarta.validation.constraints.*;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

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

    @NotBlank
    @Pattern(regexp = "\\d{5}")
    private String postCode;

    @NotBlank
    @Size(max = 100)
    private String street;

    @NotBlank
    private String content;

}
