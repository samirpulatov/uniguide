package com.samir.uniguide.dto.request;


import jakarta.validation.constraints.NotBlank;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
// body for POST /forum/threads/{id}/replies
public class ForumReplyRequest {
    @NotBlank
    private String content;

    // null = top-level reply to the thread; otherwise nests under an existing reply
    private Long parentReplyId;
}
