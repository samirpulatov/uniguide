package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.UpdateUserRequest;
import com.samir.uniguide.dto.response.GetUserResponse;
import com.samir.uniguide.dto.response.UpdateUserResponse;
import com.samir.uniguide.exception.ConflictException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final JwtService jwtService;


    public UserService(UserRepository userRepository, JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public GetUserResponse getUser(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return toGetUserResponse(user);
    }


    public UpdateUserResponse updateUser(String currentUsername, UpdateUserRequest request) {
        User user = userRepository.findByUsername(currentUsername).orElseThrow(()-> new ResourceNotFoundException("User not found"));
        if(!user.getUsername().equals(request.getUsername()) && userRepository.existsByUsername(request.getUsername())) {
            throw new ConflictException("User with this username already exists");
        }
        if(!user.getEmail().equals(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("User with this email already exists");
        }

        user.setUsername(request.getUsername());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setCity(request.getCity());
        user.setUniversity(request.getUniversity());
        User savedUser = userRepository.save(user);

        String accessToken = jwtService.generateToken(savedUser.getUsername());

        return toUpdateUserResponse(savedUser,accessToken);
    }

    private GetUserResponse toGetUserResponse(User user) {
        return GetUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .city(user.getCity())
                .university(user.getUniversity())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private UpdateUserResponse toUpdateUserResponse(User user, String accessToken) {
        GetUserResponse userResponse = toGetUserResponse(user);
        return  UpdateUserResponse.builder()
                .user(userResponse)
                .accessToken(accessToken)
                .build();

    }
}

