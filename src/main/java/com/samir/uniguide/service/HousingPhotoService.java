package com.samir.uniguide.service;

import com.samir.uniguide.dto.response.HousingPhotoResponse;
import com.samir.uniguide.exception.BadRequestException;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.entity.HousingPhoto;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.HousingPhotoRepository;
import com.samir.uniguide.repository.HousingRepository;
import com.samir.uniguide.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Photos of housing listings.
 * The image bytes live outside the database (see {@link StorageService}); the database only keeps
 * a {@link HousingPhoto} row with the storage key and the content type.
 * Because the file and the row live in two different places, every write method takes care
 * that a failure in one place does not leave a broken row behind.
 * The username always comes from the JWT, never from the URL or the request body.
 */
@Slf4j
@Service
public class HousingPhotoService {
    private final HousingPhotoRepository housingPhotoRepository;
    private final HousingRepository housingRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;

    // only formats every browser can show in <img>
    private static final Set<String> ALLOWED_TYPES = Set.of("image/png", "image/jpeg", "image/webp");


    public HousingPhotoService(HousingPhotoRepository housingPhotoRepository, HousingRepository housingRepository, UserRepository userRepository, StorageService storageService) {
        this.housingPhotoRepository = housingPhotoRepository;
        this.housingRepository = housingRepository;
        this.userRepository = userRepository;
        this.storageService = storageService;
    }


    /**
     * Uploads a photo to an own listing.
     * The file is written to storage first, then the row is saved. If saving the row fails,
     * the file is deleted again, so no file without a row is left on disk.
     *
     * @param username  current user from the JWT
     * @param housingId id of the listing the photo belongs to
     * @param file      the uploaded image
     * @return id and upload time of the new photo
     * @throws ResourceNotFoundException if the user or the listing does not exist
     * @throws ForbiddenException        if the listing belongs to another user
     * @throws BadRequestException       if the file is empty or not a JPEG, PNG or WebP image
     */
    public HousingPhotoResponse storeHousingPhoto(String username, Long housingId, MultipartFile file) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Housing housing = housingRepository.findById(housingId).orElseThrow(() -> new ResourceNotFoundException("Housing not found"));
        if(!housing.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("You are not allowed to access this resource");
        }

        // validate before touching the disk, so a bad upload never creates a file
        validatePhoto(file);

        String storageKey = storageService.store(file, "housing");

        HousingPhoto housingPhoto = HousingPhoto.builder()
                .contentType(file.getContentType())
                .storageKey(storageKey)
                .housing(housing)
                .build();
        try {
            housingPhotoRepository.save(housingPhoto);
        } catch (Exception e) {
            // roll back the file by hand: the database transaction cannot undo a file write
            try {
                storageService.delete(storageKey);
            } catch (Exception deleteEx) {
                // keep the original error as the main one, but do not lose the cleanup error
                e.addSuppressed(deleteEx);
            }
            throw new RuntimeException("Could not save housing photo", e);
        }

        return toHousingPhotoResponse(housingPhoto);
    }

    /**
     * Returns the photo metadata of a listing (not the image bytes), oldest photo first.
     * Any logged-in user can see the photos of any listing.
     *
     * @param housingId id of the listing
     * @return the photos; an empty list if the listing has none
     * @throws ResourceNotFoundException if the listing does not exist (so "no listing" differs from "no photos")
     */
    public List<HousingPhotoResponse> loadHousingPhotos(Long housingId) {
        Housing housing = housingRepository.findById(housingId).orElseThrow(() -> new ResourceNotFoundException("Housing not found"));
        return housingPhotoRepository.findAllByHousingOrderByCreatedAtAsc(housing).stream().map(HousingPhotoService::toHousingPhotoResponse).toList();
    }

    /**
     * Loads the image file of one photo, so the controller can send it to the browser.
     * The client only knows the photo id; the storage key stays on the server.
     *
     * @param photoId id of the photo
     * @return the file and its content type (needed for the {@code Content-Type} header)
     * @throws ResourceNotFoundException if the photo row or the file on disk does not exist
     */
    public HousingPhotoDetails loadHousingPhotoData(UUID photoId) {
        HousingPhoto housingPhoto = housingPhotoRepository.findById(photoId).orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        String storageKey = housingPhoto.getStorageKey();

        Resource resource = storageService.load(storageKey);
        String contentType = housingPhoto.getContentType();

        return new HousingPhotoDetails(resource, contentType);

    }

    /**
     * Deletes a photo from an own listing.
     * The row is deleted first, then the file. If the file cannot be deleted, the request still
     * succeeds: for the user the photo is already gone, and an orphan file on disk harms nobody.
     * The failure is only logged. The other order would be worse: a row pointing to a missing file.
     *
     * @param username  current user from the JWT
     * @param housingId id of the listing from the URL
     * @param photoId   id of the photo from the URL
     * @throws ResourceNotFoundException if the user, the listing or the photo does not exist,
     *                                   or the photo belongs to another listing
     * @throws ForbiddenException        if the listing belongs to another user
     */
    public void deleteHousingPhoto(String username, Long housingId, UUID photoId) {
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Housing housing = housingRepository.findById(housingId).orElseThrow(() -> new ResourceNotFoundException("Housing not found"));
        if(!housing.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("You are not allowed to access this resource");
        }

        HousingPhoto housingPhoto = housingPhotoRepository.findById(photoId).orElseThrow(() -> new ResourceNotFoundException("Photo not found"));
        // without this check an owner of listing A could delete a photo of listing B
        // by sending A's id with B's photo id; 404 because this photo does not exist in this listing
        if(!housingPhoto.getHousing().getId().equals(housing.getId())) {
            throw new ResourceNotFoundException("Photo not found");
        }

        // a database error is a real failure: let it reach GlobalExceptionHandler
        housingPhotoRepository.delete(housingPhoto);

        // file cleanup is best effort, see the Javadoc above
        try {
            storageService.delete(housingPhoto.getStorageKey());
        } catch (Exception e) {
            log.warn("Could not delete housing photo for: {}", housingPhoto.getId(), e);
        }

    }


    // checks the Content-Type sent by the client; the file content itself is not inspected
    private void validatePhoto(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new BadRequestException("Only JPEG, PNG and WebP images are allowed");
        }
    }

    // entity -> DTO; the storage key is left out on purpose, clients must not know file paths
    private static HousingPhotoResponse toHousingPhotoResponse(HousingPhoto housingPhoto) {
        return HousingPhotoResponse.builder()
                .id(housingPhoto.getId())
                .createdAt(housingPhoto.getCreatedAt())
                .build();
    }




}
