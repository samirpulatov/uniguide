package com.samir.uniguide.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;

@Getter
public class ChangePasswordRequest {
    @NotBlank
    @Size(min = 8)
    private String currentPassword;

    @NotBlank
    @Size(min = 8)
    private String newPassword;
}
