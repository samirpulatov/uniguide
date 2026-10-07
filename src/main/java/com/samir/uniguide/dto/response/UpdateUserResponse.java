package com.samir.uniguide.dto.response;


import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

// returned by PUT /users/me; accessToken is a freshly issued token since username (the JWT subject)
// may have changed, which would otherwise orphan the old token
@Builder
@Getter
@Setter
@JsonPropertyOrder({"user", "accessToken"})
public class UpdateUserResponse {
    private GetUserResponse user;
    private String accessToken;
}
