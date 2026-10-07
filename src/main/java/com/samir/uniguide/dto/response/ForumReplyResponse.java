package com.samir.uniguide.dto.response;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
// a reply node in the thread's reply tree, nested recursively via replies
public class ForumReplyResponse {
    private Long id;
    private String authorName;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // true if soft-deleted; content is then just the tombstone text
    private boolean deleted;
    // direct children of this reply in the tree
    private List<ForumReplyResponse>replies;
}
