package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.GuideCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Data
public class GuideCreationRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    @NotNull
    private GuideCategory guideCategory;
}
