package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.GuideCategory;
import com.samir.uniguide.model.enums.University;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


// body for creating/updating a guide; used by both POST /guides and PUT /guides/{id}
@Data
public class GuideCreationRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotNull
    private GuideCategory guideCategory;

    // optional: general guides (e.g. how to open a bank account) have neither
    private City city;

    private University university;

}
