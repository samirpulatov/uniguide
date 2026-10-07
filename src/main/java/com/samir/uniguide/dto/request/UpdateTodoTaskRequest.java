package com.samir.uniguide.dto.request;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter

public class UpdateTodoTaskRequest {
    @Size(max = 100)
    private String content;

    private Boolean completed;

}
