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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class HousingPhotoServiceTest {
    private static final String AUTHOR = "author";
    private static final String STRANGER = "stranger";
    private static final String KEY = "housing/photo.jpg";

    @Mock
    private HousingPhotoRepository housingPhotoRepository;
    @Mock
    private HousingRepository housingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private StorageService storageService;

    @InjectMocks
    private HousingPhotoService housingPhotoService;

    // ---------- helpers ----------

    // the ownership check compares ids, so every user needs one
    private User buildUser(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        return user;
    }

    private Housing buildHousing(Long id, User author) {
        return Housing.builder()
                .id(id)
                .title("WG room")
                .author(author)
                .build();
    }

    private HousingPhoto buildPhoto(UUID id, Housing housing, String storageKey) {
        return HousingPhoto.builder()
                .id(id)
                .contentType("image/jpeg")
                .storageKey(storageKey)
                .housing(housing)
                .build();
    }

    private MockMultipartFile buildFile(String contentType, byte[] content) {
        return new MockMultipartFile("file", "photo.jpg", contentType, content);
    }

    private MockMultipartFile buildJpeg() {
        return buildFile("image/jpeg", new byte[]{1, 2, 3});
    }

    // ---------- storeHousingPhoto ----------

    @Test
    @DisplayName("storeHousingPhoto stores the file and saves a row with the key, content type and listing")
    void storeHousingPhoto_owner_storesFileAndSavesRow() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing housing = buildHousing(1L, author);
        MockMultipartFile file = buildJpeg();
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(storageService.store(file, "housing")).thenReturn(KEY);

        //Act
        housingPhotoService.storeHousingPhoto(AUTHOR, 1L, file);

        //Assert
        ArgumentCaptor<HousingPhoto> captor = ArgumentCaptor.forClass(HousingPhoto.class);
        verify(housingPhotoRepository).save(captor.capture());
        HousingPhoto saved = captor.getValue();
        assertEquals(KEY, saved.getStorageKey());
        assertEquals("image/jpeg", saved.getContentType());
        assertSame(housing, saved.getHousing());
    }

    @Test
    @DisplayName("storeHousingPhoto throws 403 and stores nothing for someone else's listing")
    void storeHousingPhoto_notOwner_throwsForbidden() {
        //Arrange
        User stranger = buildUser(STRANGER);
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(stranger));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, buildUser(AUTHOR))));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> housingPhotoService.storeHousingPhoto(STRANGER, 1L, buildJpeg()));

        verifyNoInteractions(storageService, housingPhotoRepository);
    }

    @Test
    @DisplayName("storeHousingPhoto throws 404 and stores nothing when the listing does not exist")
    void storeHousingPhoto_unknownHousing_throwsNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(buildUser(AUTHOR)));
        when(housingRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingPhotoService.storeHousingPhoto(AUTHOR, 99L, buildJpeg()));

        verifyNoInteractions(storageService, housingPhotoRepository);
    }

    @Test
    @DisplayName("storeHousingPhoto throws 400 and stores nothing for an empty file")
    void storeHousingPhoto_emptyFile_throwsBadRequest() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author)));
        MultipartFile empty = buildFile("image/jpeg", new byte[0]);

        //Act && Assert
        assertThrows(BadRequestException.class, () -> housingPhotoService.storeHousingPhoto(AUTHOR, 1L, empty));

        verifyNoInteractions(storageService, housingPhotoRepository);
    }

    @Test
    @DisplayName("storeHousingPhoto throws 400 and stores nothing for a type outside the whitelist")
    void storeHousingPhoto_wrongType_throwsBadRequest() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author)));
        MultipartFile gif = buildFile("image/gif", new byte[]{1, 2, 3});

        //Act && Assert
        assertThrows(BadRequestException.class, () -> housingPhotoService.storeHousingPhoto(AUTHOR, 1L, gif));

        verifyNoInteractions(storageService, housingPhotoRepository);
    }

    @Test
    @DisplayName("storeHousingPhoto throws 400 when the client sent no content type")
    void storeHousingPhoto_noContentType_throwsBadRequest() {
        //Arrange
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author)));
        MultipartFile noType = buildFile(null, new byte[]{1, 2, 3});

        //Act && Assert
        assertThrows(BadRequestException.class, () -> housingPhotoService.storeHousingPhoto(AUTHOR, 1L, noType));

        verifyNoInteractions(storageService, housingPhotoRepository);
    }

    @Test
    @DisplayName("storeHousingPhoto deletes the stored file again when saving the row fails")
    void storeHousingPhoto_saveFails_deletesFileAndThrows() {
        //Arrange
        User author = buildUser(AUTHOR);
        MockMultipartFile file = buildJpeg();
        RuntimeException dbError = new RuntimeException("db down");
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author)));
        when(storageService.store(file, "housing")).thenReturn(KEY);
        when(housingPhotoRepository.save(any(HousingPhoto.class))).thenThrow(dbError);

        //Act
        RuntimeException thrown = assertThrows(RuntimeException.class,
                () -> housingPhotoService.storeHousingPhoto(AUTHOR, 1L, file));

        //Assert
        assertSame(dbError, thrown.getCause());
        verify(storageService).delete(KEY);
    }

    @Test
    @DisplayName("storeHousingPhoto keeps the DB error as the main one when the file cleanup fails too")
    void storeHousingPhoto_saveAndCleanupFail_cleanupErrorIsSuppressed() {
        //Arrange
        User author = buildUser(AUTHOR);
        MockMultipartFile file = buildJpeg();
        RuntimeException dbError = new RuntimeException("db down");
        RuntimeException diskError = new RuntimeException("disk error");
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author)));
        when(storageService.store(file, "housing")).thenReturn(KEY);
        when(housingPhotoRepository.save(any(HousingPhoto.class))).thenThrow(dbError);
        doThrow(diskError).when(storageService).delete(KEY);

        //Act
        RuntimeException thrown = assertThrows(RuntimeException.class,
                () -> housingPhotoService.storeHousingPhoto(AUTHOR, 1L, file));

        //Assert
        assertSame(dbError, thrown.getCause());
        assertSame(diskError, dbError.getSuppressed()[0]);
    }

    // ---------- loadHousingPhotos ----------

    @Test
    @DisplayName("loadHousingPhotos maps the listing's photos to responses in repository order")
    void loadHousingPhotos_returnsMappedPhotos() {
        //Arrange
        Housing housing = buildHousing(1L, buildUser(AUTHOR));
        UUID firstId = UUID.randomUUID();
        UUID secondId = UUID.randomUUID();
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(housingPhotoRepository.findAllByHousingOrderByCreatedAtAsc(housing)).thenReturn(List.of(
                buildPhoto(firstId, housing, "housing/1.jpg"),
                buildPhoto(secondId, housing, "housing/2.jpg")));

        //Act
        List<HousingPhotoResponse> result = housingPhotoService.loadHousingPhotos(1L);

        //Assert
        assertEquals(2, result.size());
        assertEquals(firstId, result.get(0).getId());
        assertEquals(secondId, result.get(1).getId());
    }

    @Test
    @DisplayName("loadHousingPhotos returns an empty list for a listing without photos")
    void loadHousingPhotos_noPhotos_returnsEmptyList() {
        //Arrange
        Housing housing = buildHousing(1L, buildUser(AUTHOR));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(housingPhotoRepository.findAllByHousingOrderByCreatedAtAsc(housing)).thenReturn(List.of());

        //Act
        List<HousingPhotoResponse> result = housingPhotoService.loadHousingPhotos(1L);

        //Assert
        assertTrue(result.isEmpty());
    }

    @Test
    @DisplayName("loadHousingPhotos throws 404 when the listing does not exist")
    void loadHousingPhotos_unknownHousing_throwsNotFound() {
        //Arrange
        when(housingRepository.findById(99L)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingPhotoService.loadHousingPhotos(99L));
    }

    // ---------- loadHousingPhotoData ----------

    @Test
    @DisplayName("loadHousingPhotoData returns the file from storage with the saved content type")
    void loadHousingPhotoData_found_returnsResourceAndContentType() {
        //Arrange
        UUID photoId = UUID.randomUUID();
        Resource resource = new ByteArrayResource(new byte[]{1, 2, 3});
        when(housingPhotoRepository.findById(photoId))
                .thenReturn(Optional.of(buildPhoto(photoId, buildHousing(1L, buildUser(AUTHOR)), KEY)));
        when(storageService.load(KEY)).thenReturn(resource);

        //Act
        HousingPhotoDetails result = housingPhotoService.loadHousingPhotoData(photoId);

        //Assert
        assertSame(resource, result.resource());
        assertEquals("image/jpeg", result.contentType());
    }

    @Test
    @DisplayName("loadHousingPhotoData throws 404 and does not touch storage when the photo does not exist")
    void loadHousingPhotoData_unknownPhoto_throwsNotFound() {
        //Arrange
        UUID photoId = UUID.randomUUID();
        when(housingPhotoRepository.findById(photoId)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingPhotoService.loadHousingPhotoData(photoId));

        verifyNoInteractions(storageService);
    }

    // ---------- deleteHousingPhoto ----------

    @Test
    @DisplayName("deleteHousingPhoto deletes the row first, then the file")
    void deleteHousingPhoto_owner_deletesRowThenFile() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing housing = buildHousing(1L, author);
        UUID photoId = UUID.randomUUID();
        HousingPhoto photo = buildPhoto(photoId, housing, KEY);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(housingPhotoRepository.findById(photoId)).thenReturn(Optional.of(photo));

        //Act
        housingPhotoService.deleteHousingPhoto(AUTHOR, 1L, photoId);

        //Assert
        // the other order would leave a row pointing to a missing file
        InOrder order = inOrder(housingPhotoRepository, storageService);
        order.verify(housingPhotoRepository).delete(photo);
        order.verify(storageService).delete(KEY);
    }

    @Test
    @DisplayName("deleteHousingPhoto throws 403 and deletes nothing for someone else's listing")
    void deleteHousingPhoto_notOwner_throwsForbidden() {
        //Arrange
        User stranger = buildUser(STRANGER);
        UUID photoId = UUID.randomUUID();
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(stranger));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, buildUser(AUTHOR))));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> housingPhotoService.deleteHousingPhoto(STRANGER, 1L, photoId));

        verifyNoInteractions(housingPhotoRepository, storageService);
    }

    @Test
    @DisplayName("deleteHousingPhoto throws 404 and deletes nothing when the photo belongs to another listing")
    void deleteHousingPhoto_photoOfOtherListing_throwsNotFound() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing ownListing = buildHousing(1L, author);
        Housing otherListing = buildHousing(2L, buildUser(STRANGER));
        UUID photoId = UUID.randomUUID();
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(ownListing));
        when(housingPhotoRepository.findById(photoId)).thenReturn(Optional.of(buildPhoto(photoId, otherListing, KEY)));

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingPhotoService.deleteHousingPhoto(AUTHOR, 1L, photoId));

        verify(housingPhotoRepository, never()).delete(any(HousingPhoto.class));
        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("deleteHousingPhoto throws 404 when the photo does not exist")
    void deleteHousingPhoto_unknownPhoto_throwsNotFound() {
        //Arrange
        User author = buildUser(AUTHOR);
        UUID photoId = UUID.randomUUID();
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(buildHousing(1L, author)));
        when(housingPhotoRepository.findById(photoId)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> housingPhotoService.deleteHousingPhoto(AUTHOR, 1L, photoId));

        verifyNoInteractions(storageService);
    }

    @Test
    @DisplayName("deleteHousingPhoto still succeeds when the file cannot be deleted (orphan file is only logged)")
    void deleteHousingPhoto_fileDeleteFails_doesNotThrow() {
        //Arrange
        User author = buildUser(AUTHOR);
        Housing housing = buildHousing(1L, author);
        UUID photoId = UUID.randomUUID();
        HousingPhoto photo = buildPhoto(photoId, housing, KEY);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(housingRepository.findById(1L)).thenReturn(Optional.of(housing));
        when(housingPhotoRepository.findById(photoId)).thenReturn(Optional.of(photo));
        doThrow(new RuntimeException("disk error")).when(storageService).delete(KEY);

        //Act && Assert
        assertDoesNotThrow(() -> housingPhotoService.deleteHousingPhoto(AUTHOR, 1L, photoId));

        verify(housingPhotoRepository).delete(photo);
    }

    // ---------- deleteAllHousingPhotosByHousingIdFromRepo ----------

    @Test
    @DisplayName("deleteAllHousingPhotosByHousingIdFromRepo deletes every row, returns the keys and leaves the files alone")
    void deleteAllHousingPhotosByHousingIdFromRepo_deletesRowsAndReturnsKeys() {
        //Arrange
        Housing housing = buildHousing(1L, buildUser(AUTHOR));
        HousingPhoto first = buildPhoto(UUID.randomUUID(), housing, "housing/1.jpg");
        HousingPhoto second = buildPhoto(UUID.randomUUID(), housing, "housing/2.jpg");
        when(housingPhotoRepository.findAllByHousingId(1L)).thenReturn(List.of(first, second));

        //Act
        List<String> keys = housingPhotoService.deleteAllHousingPhotosByHousingIdFromRepo(1L);

        //Assert
        assertEquals(List.of("housing/1.jpg", "housing/2.jpg"), keys);
        verify(housingPhotoRepository).delete(first);
        verify(housingPhotoRepository).delete(second);
        // files are deleted by the caller only after the commit
        verifyNoInteractions(storageService);
    }

    // ---------- deleteHousingPhotosFromStorage ----------

    @Test
    @DisplayName("deleteHousingPhotosFromStorage keeps going when one file cannot be deleted")
    void deleteHousingPhotosFromStorage_oneFails_deletesTheRest() {
        //Arrange
        doThrow(new RuntimeException("disk error")).when(storageService).delete("housing/1.jpg");

        //Act && Assert
        assertDoesNotThrow(() -> housingPhotoService.deleteHousingPhotosFromStorage(
                List.of("housing/1.jpg", "housing/2.jpg")));

        verify(storageService).delete("housing/2.jpg");
    }
}
