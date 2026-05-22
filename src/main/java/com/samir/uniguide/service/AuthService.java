package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.LoginRequest;
import com.samir.uniguide.dto.request.RegisterRequest;
import com.samir.uniguide.dto.response.AuthResponse;
import com.samir.uniguide.model.entity.RefreshToken;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.model.enums.Role;
import com.samir.uniguide.repository.RefreshTokenRepository;
import com.samir.uniguide.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse register(RegisterRequest request) {
        if(userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        if(userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }

        User user = User.builder()
                        .username(request.getUsername())
                        .email(request.getEmail())
                        .firstName(request.getFirstName())
                        .lastName(request.getLastName())
                        .password(passwordEncoder.encode(request.getPassword()))
                        .role(Role.STUDENT)
                        .enabled(true)
                        .build();

        userRepository.save(user);

        String accessToken = jwtService.generateToken(user.getUsername());

        RefreshToken refreshToken = RefreshToken.builder()
                        .token(UUID.randomUUID().toString())
                        .user(user)
                        .expirationDate(LocalDateTime.now().plusDays(7))
                        .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .build();

    }

    public AuthResponse login(LoginRequest request) {
        Optional<User> userOpt = request.getLogin().contains("@") ?
                userRepository.findByEmail(request.getLogin()) : userRepository.findByUsername(request.getLogin());

        User user = userOpt.orElseThrow(() -> new RuntimeException(("User not found")));

        if(!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        refreshTokenRepository.findByUser(user).ifPresent(refreshTokenRepository::delete);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(user)
                .expirationDate(LocalDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(user.getUsername()))
                .refreshToken(refreshToken.getToken())
                .build();

    }

    public AuthResponse refresh(String refreshToken) {
        Optional<RefreshToken> refreshTokenOpt = refreshTokenRepository.findByToken(refreshToken);

        if(refreshTokenOpt.isEmpty()) {
            throw new RuntimeException("Invalid refresh token");
        }

        RefreshToken refreshTokenEntity = refreshTokenOpt.get();
        if(refreshTokenEntity.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Refresh token expired");
        }

        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(refreshTokenEntity.getUser().getUsername()))
                .refreshToken(refreshTokenEntity.getToken())
                .build();

    }


}
