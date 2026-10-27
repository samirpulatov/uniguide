package com.samir.uniguide.dto.response;


import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.Role;
import com.samir.uniguide.model.enums.University;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

// returned by GET /users/me; @JsonPropertyOrder pins field order since Jackson's reflection-based
// serialization doesn't preserve declaration order on its own
@Getter
@Setter
@Builder
@JsonPropertyOrder({"id", "username", "firstName", "lastName", "email", "role", "city", "university", "createdAt", "updatedAt"})
public class GetUserResponse {
    private UUID id;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private Role role;
    private City city;
    private University university;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
