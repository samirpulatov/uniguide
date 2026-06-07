package com.samir.uniguide.dto.response;


import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Builder
@Getter
@Setter
@JsonPropertyOrder({"user", "accessToken"})
public class UpdateUserResponse {
    private GetUserResponse user;
    private String accessToken;
}
