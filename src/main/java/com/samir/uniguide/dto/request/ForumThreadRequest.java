package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.ForumCategory;
import com.samir.uniguide.model.enums.University;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// body for creating/updating a forum thread
public class ForumThreadRequest {
    @NotBlank
    private String title;

    @NotBlank
    private String content;

    // category, city and university are all optional; empty category and city together mean a global announcement
    private ForumCategory forumCategory;
    private City city;
    private University university;
}
