package com.samir.uniguide.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Metadata of a housing photo as sent to the client. The storage key is not included:
 * the client only needs the id to request the image.
 */
@Getter
@Setter
@Builder
public class HousingPhotoResponse {
    private UUID id;
    private LocalDateTime createdAt;
}
