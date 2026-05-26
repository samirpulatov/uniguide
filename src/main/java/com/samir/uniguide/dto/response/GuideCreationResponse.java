package com.samir.uniguide.dto.response;

import com.samir.uniguide.model.enums.GuideCategory;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class GuideCreationResponse {
    private Long id;
    private String title;
    private String content;
    private GuideCategory category;
    private String authorName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

}
