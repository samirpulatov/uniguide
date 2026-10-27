package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.HousingFilter;
import com.samir.uniguide.dto.request.HousingRequest;
import com.samir.uniguide.dto.response.HousingResponse;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.HousingRepository;
import com.samir.uniguide.repository.HousingSpecification;
import com.samir.uniguide.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.List;


/**
 * Housing listings created by users (rooms, flats, dorms).
 * Listings are not moderated and go live right away. Every /housing endpoint requires login
 * (see SecurityConfig), so the exact address is never shown to anonymous visitors.
 * The username always comes from the JWT (the controller passes {@code authentication.getName()}),
 * never from the URL or the request body.
 */
@Service
public class HousingService {
    private final UserRepository userRepository;
    private final HousingRepository housingRepository;
    private final HousingPhotoService housingPhotoService;
    private final TransactionTemplate transactionTemplate;

    public HousingService(UserRepository userRepository, HousingRepository housingRepository, HousingPhotoService housingPhotoService, TransactionTemplate transactionTemplate) {
        this.userRepository = userRepository;
        this.housingRepository = housingRepository;
        this.housingPhotoService = housingPhotoService;
        this.transactionTemplate = transactionTemplate;
    }


    /**
     * Creates a new listing for the current user.
     * {@code createdAt} / {@code updatedAt} are set by Hibernate on insert.
     *
     * @param housingRequest listing data (already validated: positive amounts, 5-digit postCode)
     * @param username       current user from the JWT
     * @return the saved listing
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public HousingResponse createHousing(HousingRequest housingRequest, String username) {
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Housing housing = Housing.builder()
                .houseType(housingRequest.getHouseType())
                .title(housingRequest.getTitle())
                .coldRent(housingRequest.getColdRent())
                .warmRent(housingRequest.getWarmRent())
                .area(housingRequest.getArea())
                .deposit(housingRequest.getDeposit())
                .city(housingRequest.getCity())
                .postCode(housingRequest.getPostCode())
                .street(housingRequest.getStreet())
                .content(housingRequest.getContent())
                .author(author)
                .build();

        Housing savedHousing = housingRepository.save(housing);

        return toHousingResponse(savedHousing);

    }


    /**
     * Full update (PUT) of an own listing: every field is replaced with the value from the request.
     * Unlike the to-do PATCH, a missing optional field (e.g. {@code deposit}) is overwritten with null.
     *
     * @param id             id of the listing from the URL
     * @param housingRequest the complete new listing data
     * @param username       current user from the JWT
     * @return the listing after the update
     * @throws ResourceNotFoundException if the listing does not exist
     * @throws ForbiddenException        if the listing belongs to another user
     */
    public HousingResponse updateHousing(Long id, HousingRequest housingRequest, String username) {
        Housing housing = getOwnedHousing(id, username);

        housing.setHouseType(housingRequest.getHouseType());
        housing.setTitle(housingRequest.getTitle());
        housing.setColdRent(housingRequest.getColdRent());
        housing.setWarmRent(housingRequest.getWarmRent());
        housing.setArea(housingRequest.getArea());
        housing.setDeposit(housingRequest.getDeposit());
        housing.setCity(housingRequest.getCity());
        housing.setPostCode(housingRequest.getPostCode());
        housing.setStreet(housingRequest.getStreet());
        housing.setContent(housingRequest.getContent());

        Housing savedHousing = housingRepository.save(housing);

        return toHousingResponse(savedHousing);
    }

    /**
     * Returns one listing by id. Any logged-in user can see any listing.
     *
     * @param id id of the listing from the URL
     * @return the listing
     * @throws ResourceNotFoundException if the listing does not exist
     */
    public HousingResponse getHousingById(Long id) {
        Housing housing = housingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Housing not found"));
        return toHousingResponse(housing);
    }

    /**
     * Returns all listings of the current user (backs GET /housing/me).
     *
     * @param username current user from the JWT
     * @return the user's listings; an empty list if there are none
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public List<HousingResponse> getMyHousings(String username) {
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // no N+1 here: all listings share this one author, already in the persistence context
        return housingRepository.getHousingsByAuthor(author).stream().map(HousingService::toHousingResponse).toList();
    }

    /**
     * Returns all listings that match the filter; every filter field is optional.
     * Price: {@code minWarmRent} and {@code maxWarmRent} are both inclusive (slider in the UI).
     * Area: {@code minArea} is inclusive, {@code maxArea} is exclusive, so the UI buckets
     * (&lt;50 / 50–100 / ≥100) never overlap and a 50 m² flat lands only in "50–100".
     * Filtering by warm rent, because that is what a student actually pays.
     *
     * @param filter query params from GET /housing (already validated: no negative values)
     * @return matching listings; all listings if no filter is set
     */
    public List<HousingResponse> getAllHousings(HousingFilter filter) {
        // each null filter returns a null predicate, which Specification simply skips
        Specification<Housing> spec = Specification
                .where(HousingSpecification.hasCity(filter.getCity()))
                .and(HousingSpecification.hasHouseType(filter.getHouseType()))
                .and(HousingSpecification.hasMinArea(filter.getMinArea()))
                .and(HousingSpecification.hasMaxArea(filter.getMaxArea()))
                .and(HousingSpecification.hasMinWarmRent(filter.getMinWarmRent()))
                .and(HousingSpecification.hasMaxWarmRent(filter.getMaxWarmRent()));

        // findAll(spec) is overridden with @EntityGraph in HousingRepository, so authors come in the same SELECT (no N+1)
        return housingRepository.findAll(spec)
                .stream()
                .map(HousingService::toHousingResponse)
                .toList();

    }

    /**
     * Deletes an own listing together with all its photos.
     * Photo rows and the listing row are deleted in one transaction, so either both are gone
     * or nothing changes. The photo files are deleted only after the commit: a file delete cannot
     * be rolled back, so deleting files earlier could leave rows that point to missing files.
     * If a file cannot be deleted, the orphan is only logged (see HousingPhotoService).
     *
     * @param id       id of the listing from the URL
     * @param username current user from the JWT
     * @throws ResourceNotFoundException if the listing does not exist
     * @throws ForbiddenException        if the listing belongs to another user
     */
    public void deleteHousing(Long id, String username) {
        Housing housing = getOwnedHousing(id, username);
        // TransactionTemplate instead of @Transactional: the commit happens when execute() returns,
        // so the file cleanup below runs after it. @Transactional on this method would commit only
        // after the files are gone, and on a private helper it would be ignored (self-invocation skips the proxy)
        List<String> keys = transactionTemplate.execute(status -> {
            // photo rows first: housing_photo has a foreign key to housing
            List<String> storageKeys = housingPhotoService.deleteAllHousingPhotosByHousingIdFromRepo(housing.getId());
            housingRepository.delete(housing);
            return storageKeys;
        });

        housingPhotoService.deleteHousingPhotosFromStorage(keys);
    }



    // loads a listing and makes sure it belongs to the current user; shared by update and delete,
    // so the ownership check lives in one place. Order matters: 404 for a missing id, 403 for someone else's listing
    private Housing getOwnedHousing(Long id, String username) {
        User author = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Housing housing = housingRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Housing not found"));
        // author is LAZY, but getId() on the proxy does not trigger an extra query
        if(!housing.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("You are not author of this housing");
        }

        return housing;
    }


    // entity -> DTO; getUsername() reads the LAZY author, so list queries must load authors up front
    private static HousingResponse toHousingResponse(Housing housing) {

        return HousingResponse.builder()
                .id(housing.getId())
                .houseType(housing.getHouseType())
                .title(housing.getTitle())
                .coldRent(housing.getColdRent())
                .warmRent(housing.getWarmRent())
                .area(housing.getArea())
                .deposit(housing.getDeposit())
                .city(housing.getCity())
                .postCode(housing.getPostCode())
                .street(housing.getStreet())
                .content(housing.getContent())
                .createdAt(housing.getCreatedAt())
                .updatedAt(housing.getUpdatedAt())
                .authorName(housing.getAuthor().getUsername())
                .build();

    }
}
