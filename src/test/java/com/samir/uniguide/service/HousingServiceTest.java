package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.HousingFilter;
import com.samir.uniguide.dto.request.HousingRequest;
import com.samir.uniguide.dto.response.HousingResponse;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.Housing;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import com.samir.uniguide.repository.HousingRepository;
import com.samir.uniguide.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HousingServiceTest {
    private static final String AUTHOR = "author";
    private static final String STRANGER = "stranger";

    @Mock
    private HousingRepository housingRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private HousingService housingService;

    // ---------- helpers ----------

    // the ownership check compares ids, so every user needs one
    private User buildUser(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        return user;
    }

    private Housing buildHousing(Long id, User author, String title) {
        return Housing.builder()
                .id(id)
                .houseType(HouseType.WG_ROOM)
                .title(title)
                .coldRent(new BigDecimal("300.00"))
                .warmRent(new BigDecimal("400.00"))
                .area(new BigDecimal("18.50"))
                .deposit(new BigDecimal("900.00"))
                .city(City.SIEGEN)
                .postCode("57072")
                .street("Hölderlinstraße 3")
                .content("Room in a shared flat")
                .author(author)
                .build();
    }

    private HousingRequest buildRequest() {
        HousingRequest request = new HousingRequest();
        request.setHouseType(HouseType.APARTMENT);
        request.setTitle("Flat near campus");
        request.setColdRent(new BigDecimal("550.00"));
        request.setWarmRent(new BigDecimal("700.00"));
        request.setArea(new BigDecimal("45.00"));
        request.setDeposit(new BigDecimal("1650.00"));
        request.setCity(City.SIEGEN);
        request.setPostCode("57076");
        request.setStreet("Adolf-Reichwein-Straße 2");
        request.setContent("Two rooms, kitchen, balcony");
        return request;
    }

    // ---------- createHousing ----------

    @Test
    @DisplayName("createHousing saves a listing owned by the current user with every field from the request")
    void createHousing_savesHousingForCurrentUser() {
        //Arrange
        User author = buildUser(AUTHOR);
        HousingRequest request = buildRequest();
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.save(any(Housing.class))).thenAnswer(invocation -> {
            Housing saved = invocation.getArgument(0);
            saved.setId(1L);
            return saved;
        });

        //Act
        HousingResponse result = housingService.createHousing(request, AUTHOR);

        //Assert
        // check what actually went to the DB, not only the response
        ArgumentCaptor<Housing> captor = ArgumentCaptor.forClass(Housing.class);
        verify(housingRepository).save(captor.capture());
        Housing saved = captor.getValue();
        assertSame(author, saved.getAuthor());
        assertEquals(HouseType.APARTMENT, saved.getHouseType());
        assertEquals("Flat near campus", saved.getTitle());
        assertEquals(new BigDecimal("550.00"), saved.getColdRent());
        assertEquals(new BigDecimal("700.00"), saved.getWarmRent());
        assertEquals(new BigDecimal("45.00"), saved.getArea());
        assertEquals(new BigDecimal("1650.00"), saved.getDeposit());
        assertEquals(City.SIEGEN, saved.getCity());
        assertEquals("57076", saved.getPostCode());
        assertEquals("Adolf-Reichwein-Straße 2", saved.getStreet());
        assertEquals("Two rooms, kitchen, balcony", saved.getContent());

        assertEquals(1L, result.getId());
        assertEquals("Flat near campus", result.getTitle());
        assertEquals(AUTHOR, result.getAuthorName());
    }

    @Test
    @DisplayName("createHousing throws 404 and saves nothing when the user from the token does not exist")
    void createHousing_unknownUser_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingService.createHousing(buildRequest(), AUTHOR));

        verify(housingRepository, never()).save(any(Housing.class));
    }

    // ---------- getHousingById ----------

    @Test
    @DisplayName("getHousingById maps an existing listing to a response")
    void getHousingById_found_returnsResponse() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author, "WG room")));

        //Act
        HousingResponse result = housingService.getHousingById(1L);

        //Assert
        assertEquals(1L, result.getId());
        assertEquals("WG room", result.getTitle());
        assertEquals(HouseType.WG_ROOM, result.getHouseType());
        assertEquals(new BigDecimal("400.00"), result.getWarmRent());
        assertEquals("57072", result.getPostCode());
        assertEquals(AUTHOR, result.getAuthorName());
    }

    @Test
    @DisplayName("getHousingById throws 404 when the listing does not exist")
    void getHousingById_missing_throwsNotFound() {
        //Arrange
        when(housingRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingService.getHousingById(99L));
    }

    // ---------- getMyHousings ----------

    @Test
    @DisplayName("getMyHousings maps the user's listings to responses in repository order")
    void getMyHousings_returnsMappedHousings() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.getHousingsByAuthor(author)).thenReturn(List.of(
                buildHousing(1L, author, "first"),
                buildHousing(2L, author, "second")));

        //Act
        List<HousingResponse> result = housingService.getMyHousings(AUTHOR);

        //Assert
        assertEquals(2, result.size());
        assertEquals("first", result.get(0).getTitle());
        assertEquals("second", result.get(1).getTitle());
        assertEquals(AUTHOR, result.get(1).getAuthorName());
    }

    @Test
    @DisplayName("getMyHousings returns an empty list when the user has no listings")
    void getMyHousings_noHousings_returnsEmptyList() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.getHousingsByAuthor(author)).thenReturn(List.of());

        //Act
        List<HousingResponse> result = housingService.getMyHousings(AUTHOR);

        //Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("getMyHousings throws 404 when the user from the token does not exist")
    void getMyHousings_unknownUser_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingService.getMyHousings(AUTHOR));
    }

    // ---------- getAllHousings ----------

    // the predicates of HousingSpecification need a real DB (Criteria API), so here we only check
    // that a Specification reaches the repository and the results are mapped
    @Test
    @DisplayName("getAllHousings passes a Specification to the repository and maps the results")
    @SuppressWarnings("unchecked")
    void getAllHousings_withFilter_returnsMappedHousings() {
        //Arrange
        User author = buildUser(AUTHOR);
        HousingFilter filter = new HousingFilter();
        filter.setCity(City.SIEGEN);
        filter.setHouseType(HouseType.WG_ROOM);
        filter.setMaxWarmRent(new BigDecimal("500"));
        when(housingRepository.findAll(any(Specification.class))).thenReturn(List.of(buildHousing(1L, author, "WG room")));

        //Act
        List<HousingResponse> result = housingService.getAllHousings(filter);

        //Assert
        verify(housingRepository).findAll(any(Specification.class));
        assertEquals(1, result.size());
        assertEquals("WG room", result.getFirst().getTitle());
        assertEquals(City.SIEGEN, result.getFirst().getCity());
        assertEquals(AUTHOR, result.getFirst().getAuthorName());
    }

    @Test
    @DisplayName("getAllHousings with an empty filter still works and returns everything the repository finds")
    @SuppressWarnings("unchecked")
    void getAllHousings_emptyFilter_returnsAll() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(housingRepository.findAll(any(Specification.class))).thenReturn(List.of(
                buildHousing(1L, author, "first"),
                buildHousing(2L, author, "second")));

        //Act
        List<HousingResponse> result = housingService.getAllHousings(new HousingFilter());

        //Assert
        assertEquals(2, result.size());
    }

    // ---------- updateHousing ----------

    @Test
    @DisplayName("updateHousing replaces every field of the owner's listing")
    void updateHousing_owner_replacesAllFields() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing housing = buildHousing(1L, author, "old title");
        HousingRequest request = buildRequest();
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(housingRepository.save(housing)).thenReturn(housing);

        //Act
        HousingResponse result = housingService.updateHousing(1L, request, AUTHOR);

        //Assert
        ArgumentCaptor<Housing> captor = ArgumentCaptor.forClass(Housing.class);
        verify(housingRepository).save(captor.capture());
        Housing saved = captor.getValue();
        assertEquals(1L, saved.getId());
        assertSame(author, saved.getAuthor());
        assertEquals(HouseType.APARTMENT, saved.getHouseType());
        assertEquals("Flat near campus", saved.getTitle());
        assertEquals(new BigDecimal("550.00"), saved.getColdRent());
        assertEquals(new BigDecimal("700.00"), saved.getWarmRent());
        assertEquals(new BigDecimal("45.00"), saved.getArea());
        assertEquals(new BigDecimal("1650.00"), saved.getDeposit());
        assertEquals(City.SIEGEN, saved.getCity());
        assertEquals("57076", saved.getPostCode());
        assertEquals("Adolf-Reichwein-Straße 2", saved.getStreet());
        assertEquals("Two rooms, kitchen, balcony", saved.getContent());

        assertEquals("Flat near campus", result.getTitle());
        assertEquals(AUTHOR, result.getAuthorName());
    }

    @Test
    @DisplayName("updateHousing is a full PUT: a missing deposit overwrites the old one with null")
    void updateHousing_missingDeposit_overwritesWithNull() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing housing = buildHousing(1L, author, "WG room");
        HousingRequest request = buildRequest();
        request.setDeposit(null);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(housingRepository.save(housing)).thenReturn(housing);

        //Act
        HousingResponse result = housingService.updateHousing(1L, request, AUTHOR);

        //Assert
        assertNull(result.getDeposit());
    }

    @Test
    @DisplayName("updateHousing throws 403 and saves nothing when the listing belongs to another user")
    void updateHousing_notOwner_throwsForbidden() {
        //Arrange
        User author = buildUser(AUTHOR);
        User stranger = buildUser(STRANGER);
        Housing housing = buildHousing(1L, author, "WG room");
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(stranger));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> housingService.updateHousing(1L, buildRequest(), STRANGER));

        assertEquals("WG room", housing.getTitle());
        verify(housingRepository, never()).save(any(Housing.class));
    }

    @Test
    @DisplayName("updateHousing throws 404 and saves nothing when the listing does not exist")
    void updateHousing_missingHousing_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(buildUser(AUTHOR)));
        when(housingRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingService.updateHousing(99L, buildRequest(), AUTHOR));

        verify(housingRepository, never()).save(any(Housing.class));
    }

    // ---------- deleteHousing ----------

    @Test
    @DisplayName("deleteHousing deletes the owner's listing")
    void deleteHousing_owner_deletes() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing housing = buildHousing(1L, author, "WG room");
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));

        //Act
        housingService.deleteHousing(1L, AUTHOR);

        //Assert
        verify(housingRepository).delete(housing);
    }

    @Test
    @DisplayName("deleteHousing throws 403 and deletes nothing when the listing belongs to another user")
    void deleteHousing_notOwner_throwsForbidden() {
        //Arrange
        User author = buildUser(AUTHOR);
        User stranger = buildUser(STRANGER);
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(stranger));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author, "WG room")));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> housingService.deleteHousing(1L, STRANGER));

        verify(housingRepository, never()).delete(any(Housing.class));
    }

    @Test
    @DisplayName("deleteHousing throws 404 and deletes nothing when the listing does not exist")
    void deleteHousing_missingHousing_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(buildUser(AUTHOR)));
        when(housingRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingService.deleteHousing(99L, AUTHOR));

        verify(housingRepository, never()).delete(any(Housing.class));
    }
}
