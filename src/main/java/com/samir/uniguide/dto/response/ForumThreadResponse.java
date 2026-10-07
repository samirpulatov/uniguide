package com.samir.uniguide.dto.response;


import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.ForumCategory;
import com.samir.uniguide.model.enums.University;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
// response shape for forum thread endpoints; replies are only populated on the single-thread detail view
public class ForumThreadResponse {
    private Long id;
    private String authorName;
    private String title;
    private String content;
    private ForumCategory forumCategory;
    private City city;
    private University university;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // root replies of the tree; each reply nests its own children the same way
    private List<ForumReplyResponse> replies;
}
