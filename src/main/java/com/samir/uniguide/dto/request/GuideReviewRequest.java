package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.GuideStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


// body for POST /admin/guides/{id}/review
@Data
public class GuideReviewRequest {
    @NotNull
    private GuideStatus action;
    // required only when action is REJECTED
    private String rejectionReason;
}
