package com.samir.uniguide.dto.response;

import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.annotation.JsonRootName;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

// standard error body returned by GlobalExceptionHandler and the security entry points
@Builder
@Data
@JsonPropertyOrder({"status", "message", "error", "timestamp", "path"})
public class ErrorResponse {
    private int status;
    private String message;
    private String error;
    private LocalDateTime timestamp;
    private String path;
}
