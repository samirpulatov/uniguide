package com.samir.uniguide.service;

import org.springframework.core.io.Resource;

/**
 * Internal result of {@link HousingPhotoService#loadHousingPhotoData}: everything the controller
 * needs to send an image to the browser. Not a JSON response, so it lives next to the service.
 *
 * @param resource    the image file
 * @param contentType MIME type saved at upload time, used for the {@code Content-Type} header
 */
public record HousingPhotoDetails (Resource resource, String contentType){ }
