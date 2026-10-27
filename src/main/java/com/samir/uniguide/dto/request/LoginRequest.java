package com.samir.uniguide.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// body for POST /auth/login
@Data
public class LoginRequest {
    // accepts either a username or an email; AuthService tells them apart by checking for "@"
    @NotBlank
    private String login;
    @NotBlank
    private String password;
}
