package com.samir.uniguide.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class TodoTaskResponse {
    private Long id;
    private String content;
    private boolean completed;
    private LocalDateTime createdAt;
}
