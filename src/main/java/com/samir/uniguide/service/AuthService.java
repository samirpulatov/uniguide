package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.RegisterRequest;
import com.samir.uniguide.dto.response.AuthResponse;
import com.samir.uniguide.repository.RefreshTokenRepository;
import com.samir.uniguide.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    //private final PasswordEncoder passwordEncoder;



}
