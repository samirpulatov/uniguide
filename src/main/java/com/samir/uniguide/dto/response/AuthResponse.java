package com.samir.uniguide.dto.response;

import lombok.Builder;
import lombok.Data;

// returned by register/login/refresh and password change
@Data
@Builder
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
}
