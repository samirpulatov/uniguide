package com.samir.uniguide.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank
    private String username;

    @NotBlank
    @Size(min = 8)
    private String password;
    @NotBlank
    private String firstName;
    @NotBlank
    private String lastName;

    @NotBlank
    @Email
    private String email;
}
