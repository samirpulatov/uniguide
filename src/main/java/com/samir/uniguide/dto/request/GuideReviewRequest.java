package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.GuideStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


@Data
public class GuideReviewRequest {
    @NotNull
    private GuideStatus action;
    private String rejectionReason;
}
