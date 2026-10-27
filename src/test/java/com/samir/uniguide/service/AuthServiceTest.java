package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.LoginRequest;
import com.samir.uniguide.dto.request.RegisterRequest;
import com.samir.uniguide.dto.response.AuthResponse;

import com.samir.uniguide.exception.ConflictException;
import com.samir.uniguide.exception.InvalidTokenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.RefreshToken;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.RefreshTokenRepository;
import com.samir.uniguide.repository.UserRepository;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    @Test
    @DisplayName("Creates and saves a new user")
    void register_newUserWithRoleStudent_andReturns_AuthResponse() {
        //Arrange
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testUser");
        request.setEmail("test@gmail.com");
        request.setPassword("password");
        request.setFirstName("Test");
        request.setLastName("User");

        when(userRepository.existsByEmail("test@gmail.com")).thenReturn(false);
        when(userRepository.existsByUsername("testUser")).thenReturn(false);
        when(passwordEncoder.encode("password")).thenReturn("hashedPassword");
        when(jwtService.generateToken("testUser")).thenReturn("fake-token");

        //Act
        AuthResponse response = authService.register(request);

        //Assert
        assertEquals("fake-token",response.getAccessToken());
        assertNotNull(response.getRefreshToken());

    }

    @Test
    @DisplayName("Throws ConflictException while creating a new user with existing email")
    void register_existingEmail_throwsConflictException() {
        //Arrange
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testUser");
        request.setEmail("test@gmail.com");
        request.setPassword("password");
        request.setFirstName("Test");
        request.setLastName("User");

        when(userRepository.existsByEmail("test@gmail.com")).thenReturn(true);

        //Act && Assert
        assertThrows(ConflictException.class, () -> authService.register(request));
        verify(userRepository,never()).save(any());

    }

    @Test
    @DisplayName("Throws ConflictException while creating a new user with existing username")
    void register_existingUserName_throwsConflictException() {
        //Arrange
        RegisterRequest request = new RegisterRequest();
        request.setUsername("testUser");
        request.setEmail("test@gmail.com");
        request.setPassword("password");
        request.setFirstName("Test");
        request.setLastName("User");

        when(userRepository.existsByEmail("test@gmail.com")).thenReturn(false);
        when(userRepository.existsByUsername("testUser")).thenReturn(true);

        //Act && Assert
        assertThrows(ConflictException.class, () ->  authService.register(request));

    }


    @Test
    @DisplayName("Login an existing user via username and return AuthResponse")
    void login_an_existingUser_with_a_Username_andReturn_AuthResponse(){
        //Arrange
        LoginRequest request = new LoginRequest();
        request.setLogin("testUser");
        request.setPassword("password");

        User existingUser = User.builder()
                .username("testUser")
                .password("hashedPassword")
                .build();

        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password", "hashedPassword")).thenReturn(true);
        when(jwtService.generateToken("testUser")).thenReturn("fake-token");
        //Act
        AuthResponse response = authService.login(request);

        //Assert
        assertEquals("fake-token",response.getAccessToken());
        assertNotNull(response.getRefreshToken());

    }

    @Test
    @DisplayName("Login an existing user via email and return AuthResponse")
    void login_an_existingUser_with_a_Email_andReturn_AuthResponse() {
        //Arrange
        LoginRequest request = new LoginRequest();
        request.setLogin("test@gmail.com");
        request.setPassword("password");

        User existingUser = User.builder()
                .username("testUser")
                .email("test@gmail.com")
                .password("hashedPassword")
                .build();

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("password","hashedPassword")).thenReturn(true);
        when(jwtService.generateToken("testUser")).thenReturn("fake-access-token");

        //Act
        AuthResponse response = authService.login(request);

        //Assert
        assertEquals("fake-access-token",response.getAccessToken());
        assertNotNull(response.getRefreshToken());
    }


    @Test
    @DisplayName("Throws ResourceNotFoundException while trying to login")
    void login_with_an_usernameAnd_throws_ResourceNotFoundException() {
        //Arrange
        LoginRequest request = new LoginRequest();
        request.setLogin("testUser");
        request.setPassword("password");

        when(userRepository.findByUsername("testUser")).thenReturn(Optional.empty());

        //Act && assert
        assertThrows(ResourceNotFoundException.class, () -> authService.login(request));



    }

    @Test
    @DisplayName("Throws ResourceNotFoundException while trying to login")
    void login_with_an_EmailAnd_throws_ResourceNotFoundException() {
        //Arrange
        LoginRequest request = new LoginRequest();
        request.setLogin("test@gmail.com");
        request.setPassword("password");

        when(userRepository.findByEmail("test@gmail.com")).thenReturn(Optional.empty());

        //Act && assert
        assertThrows(ResourceNotFoundException.class, () -> authService.login(request));
    }

    @Test
    @DisplayName("Throws InvalidTokenException because of password")
    void login_with_wrong_password_andThrows_InvalidTokenException() {
        //Arrange
        LoginRequest request = new LoginRequest();
        request.setLogin("testUser");
        request.setPassword("wrongPassword");

        User existingUser = User.builder()
                .username("testUser")
                .email("test@gmail.com")
                .password("hashedPassword")
                .build();

        when(userRepository.findByUsername("testUser")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrongPassword","hashedPassword")).thenReturn(false);

        //Act && assert
        assertThrows(InvalidTokenException.class,() -> authService.login(request));
    }


    @Test
    @DisplayName("Refresh an existing refreshToken and return AuthResponse")
    void refresh_and_return_AuthResponse() {
        //Arrange
        String refreshToken = "refreshToken";

        User existingUser = User.builder()
                .username("testUser")
                .email("test@gmail.com")
                .password("hashedPassword")
                .build();

        RefreshToken rf = RefreshToken.builder()
                .token(refreshToken)
                .user(existingUser)
                .expirationDate(LocalDateTime.now().plusDays(7))
                .build();

        when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.of(rf));
        when(jwtService.generateToken(rf.getUser().getUsername())).thenReturn("fake-access-token");

        //Act
        AuthResponse response = authService.refresh(refreshToken);

        //Assert
        assertEquals("fake-access-token",response.getAccessToken());
        assertEquals(refreshToken, response.getRefreshToken());
    }

    @Test
    @DisplayName("Throws an InvalidTokenException since refreshToken is Empty")
    void refresh_and_throws_InvalidTokenException_token_not_found() {
        //Arrange
        String refreshToken = "refreshToken";
        when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(InvalidTokenException.class,() -> authService.refresh(refreshToken));
    }

    @Test
    @DisplayName("Throws an InvalidTokenException since token is expired")
    void refresh_and_throws_InvalidTokenException_token_is_expired(){
        //Arrange
        String refreshToken = "refreshToken";

        User existingUser = User.builder()
                .username("testUser")
                .email("test@gmail.com")
                .password("hashedPassword")
                .build();

        RefreshToken rf = RefreshToken.builder()
                .token(refreshToken)
                .user(existingUser)
                .expirationDate(LocalDateTime.now().minusDays(7))
                .build();

        when(refreshTokenRepository.findByToken(refreshToken)).thenReturn(Optional.of(rf));

        //Act && Assert
        assertThrows(InvalidTokenException.class,() -> authService.refresh(refreshToken));
    }
}
