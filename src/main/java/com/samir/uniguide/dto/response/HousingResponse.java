package com.samir.uniguide.dto.response;


import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class HousingResponse {
    private Long id;
    private HouseType houseType;
    private String title;
    private BigDecimal coldRent;
    private BigDecimal warmRent;
    private BigDecimal area;
    private BigDecimal deposit;
    private City city;
    private String postCode;
    private String street;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String authorName;
}
