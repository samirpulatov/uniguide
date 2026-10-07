package com.samir.uniguide.dto.request;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter

public class TodoTaskCreationRequest {
    @NotBlank
    @Size(max=100)
    private String content;
}
