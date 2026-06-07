package com.samir.uniguide.controller;


import com.samir.uniguide.dto.request.UpdateUserRequest;
import com.samir.uniguide.dto.response.GetUserResponse;
import com.samir.uniguide.dto.response.UpdateUserResponse;
import com.samir.uniguide.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@Tag(name = "User", description = "The User API")
@RestController
@RequestMapping("/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "Get current users profile",security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/me")
    public ResponseEntity<GetUserResponse> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getUser(authentication.getName()));
    }

    @Operation(summary = "Update current users profile", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/me")
    public ResponseEntity<UpdateUserResponse> updateCurrentUser(@Valid @RequestBody UpdateUserRequest request,
                                                                Authentication authentication) {
        return ResponseEntity.ok(userService.updateUser(authentication.getName(), request));
    }

}
