package com.samir.uniguide.dto.request;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.University;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;


// body for PUT /users/me
@Getter
@Setter
public class UpdateUserRequest {
    @NotBlank private String username;
    @NotBlank @Email private String email;
    @NotBlank private String firstName;
    @NotBlank private String lastName;
    private City city;
    private University university;

}
