package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.ChangePasswordRequest;
import com.samir.uniguide.dto.request.UpdateUserRequest;
import com.samir.uniguide.dto.response.AuthResponse;
import com.samir.uniguide.dto.response.GetUserResponse;
import com.samir.uniguide.dto.response.UpdateUserResponse;
import com.samir.uniguide.exception.ConflictException;
import com.samir.uniguide.exception.InvalidTokenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
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


import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("get user")
    void getUser() {
        //Arrange
        String username = "testUser";
        User user = User.builder().username(username).build();
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        //Act
        GetUserResponse response = userService.getUser(username);

        //Assert
        assertEquals(username, response.getUsername());
    }

    @Test
    @DisplayName("getUser throws ResourceNotFoundException for nonexisting user")
    void getUser_throws_ResourceNotFoundException() {
        //Arrange
        String username = "nonexistingUser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> userService.getUser(username));
    }

    @Test
    @DisplayName("updateUser return UpdateUserResponse")
    void updateUser() {
        //Arrange
        String username = "testUser";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("updatedUserName");
        request.setEmail("updated@gmail.com");
        request.setFirstName("Test");
        request.setLastName("User");

        User user = User.builder().username(username).email("test@gmail.com").build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);
        when(jwtService.generateToken("updatedUserName")).thenReturn("access-token");

        //Act
        UpdateUserResponse response = userService.updateUser(username,request);

        //Assert
        assertEquals("updatedUserName",response.getUser().getUsername());
        assertEquals("updated@gmail.com",response.getUser().getEmail());
        assertEquals("Test",response.getUser().getFirstName());
        assertEquals("User",response.getUser().getLastName());
        assertEquals("access-token",response.getAccessToken());
    }

    @Test
    @DisplayName("updateUser throws ResourceNotFoundException for user not found")
    void updateUser_throws_ResourceNotFoundException() {
        //Arrange
        String username = "testUser";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("updatedUserName");
        request.setEmail("updated@gmail.com");
        request.setFirstName("Test");
        request.setLastName("User");

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> userService.updateUser(username,request));
    }

    @Test
    @DisplayName("updateUser throws ConflictException when new username is already taken")
    void updateUser_throws_ConflictException_when_new_username_already_taken() {
        //Arrange
        String username = "testUser";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("updatedUser"); //different from current username, already taken
        request.setEmail("updated@gmail.com");
        request.setFirstName("Test");
        request.setLastName("User");

        User user = User.builder().username(username).build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(true);

        //Act && assert
        assertThrows(ConflictException.class, () -> userService.updateUser(username,request));
    }

    @Test
    @DisplayName("updateUser throws ConflictException when new email is already taken")
    void updateUser_throws_ConflictException_when_new_email_already_taken(){
        //Arrange
        String username = "testUser";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("testUser"); //unchanged, skips username check
        request.setEmail("updated@gmail.com");
        request.setFirstName("Test");
        request.setLastName("User");

        User user = User.builder()
                .username(username)
                .email("test@gmail.com")
                .build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        //Act && assert
        assertThrows(ConflictException.class, () -> userService.updateUser(username,request));
    }

    @Test
    @DisplayName("updateUser does not check username conflict when username is unchanged")
    void updateUser_does_not_check_conflict_when_username_unchanged() {
        //Arrange
        String username = "testUser";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("testUser"); // same as current username
        request.setEmail("updated@gmail.com");
        request.setFirstName("Test");
        request.setLastName("User");

        User user = User.builder().username(username).email("test@gmail.com").build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);
        when(jwtService.generateToken("testUser")).thenReturn("access-token");

        //Act
        assertDoesNotThrow(() -> userService.updateUser(username, request));

        //Assert
        verify(userRepository, never()).existsByUsername(anyString());
    }

    @Test
    @DisplayName("updateUser does not check email conflict when email is unchanged")
    void updateUser_does_not_check_conflict_when_email_unchanged() {
        //Arrange
        String username = "testUser";
        UpdateUserRequest request = new UpdateUserRequest();
        request.setUsername("updatedUserName");
        request.setEmail("test@gmail.com"); // same as current email
        request.setFirstName("Test");
        request.setLastName("User");

        User user = User.builder().username(username).email("test@gmail.com").build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.existsByUsername(request.getUsername())).thenReturn(false);
        when(userRepository.save(user)).thenReturn(user);
        when(jwtService.generateToken("updatedUserName")).thenReturn("access-token");

        //Act
        assertDoesNotThrow(() -> userService.updateUser(username, request));

        //Assert
        verify(userRepository, never()).existsByEmail(anyString());
    }

    @Test
    @DisplayName("changePassword returns AuthResponse")
    void changePassword() {
        //Arrange
        String username = "testUser";

        ChangePasswordRequest request = new ChangePasswordRequest();



        User user = User.builder().username(username).build();
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches(request.getCurrentPassword(),user.getPassword())).thenReturn(true);
        when(passwordEncoder.encode(request.getNewPassword())).thenReturn("newPassword");
        when(userRepository.save(user)).thenReturn(user);
        when(jwtService.generateToken(username)).thenReturn("access-token");
        //Act
        AuthResponse response = userService.changePassword(username,request);

        //Assert
        assertEquals("access-token",response.getAccessToken());
        assertNotNull(response.getRefreshToken());

    }

    @Test
    @DisplayName("changePassword throws ResourceNotFoundException")
    void changePassword_throws_ResourceNotFoundException() {
        //Arrange
        String username = "testUser";

        ChangePasswordRequest request = new ChangePasswordRequest();


        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> userService.changePassword(username,request));

    }

    @Test
    @DisplayName("changePassword throws InvalidTokenException")
    void changePassword_throws_InvalidTokenException() {
        //Arrange
        String username = "testUser";

        ChangePasswordRequest request = new ChangePasswordRequest();

        User existingUser = User.builder().username(username).build();

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches(request.getCurrentPassword(), existingUser.getPassword())).thenReturn(false);

        //Act && Assert
        assertThrows(InvalidTokenException.class, () -> userService.changePassword(username, request));
    }
}
