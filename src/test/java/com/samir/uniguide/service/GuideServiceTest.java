package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.GuideCreationRequest;
import com.samir.uniguide.dto.request.GuideReviewRequest;
import com.samir.uniguide.dto.response.GuideCreationResponse;
import com.samir.uniguide.exception.BadRequestException;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.Guide;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.GuideCategory;
import com.samir.uniguide.model.enums.GuideStatus;
import com.samir.uniguide.model.enums.Role;
import com.samir.uniguide.model.enums.University;
import com.samir.uniguide.repository.GuideRepository;
import com.samir.uniguide.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class GuideServiceTest {
    @Mock
    private GuideRepository guideRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GuideService guideService;

    private Guide buildGuide(Long id, String title, String content, GuideCategory category, GuideStatus status, String authorUsername) {
        return Guide.builder()
                .id(id)
                .title(title)
                .content(content)
                .guideCategory(category)
                .city(City.SIEGEN)
                .university(University.UNI_SIEGEN)
                .author(User.builder().username(authorUsername).build())
                .guideStatus(status)
                .build();
    }

    @Test
    @DisplayName("Creates a new Guide and return GuideCreationResponse")
    void createGuide_and_return_GuideCreationResponse(){
        //Arrange
        String userName = "testUser";

        GuideCreationRequest request = new GuideCreationRequest();
        request.setTitle("Test Guide");
        request.setContent("This is a test guide");
        request.setGuideCategory(GuideCategory.BUREAUCRACY);
        request.setCity(City.SIEGEN);
        request.setUniversity(University.UNI_SIEGEN);

        User existingUser = User.builder()
                .username(userName)
                .build();

        when(userRepository.findByUsername(userName)).thenReturn(Optional.of(existingUser));
        when(guideRepository.save(any(Guide.class))).thenAnswer(invocation -> {
            Guide savedGuide = invocation.getArgument(0);
            savedGuide.setId(1L);
            return savedGuide;
        });

        //Act
        GuideCreationResponse response = guideService.createGuide(request, userName);

        //Assert
        assertEquals("Test Guide", response.getTitle());
        assertEquals("This is a test guide", response.getContent());
        assertEquals(GuideCategory.BUREAUCRACY, response.getCategory());
        assertEquals(City.SIEGEN, response.getCity());
        assertEquals(University.UNI_SIEGEN, response.getUniversity());
        assertEquals(userName, response.getAuthorName());
        assertEquals(GuideStatus.PENDING, response.getStatus());
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException cause user is not found")
    void createGuide_and_throw_ResourceNotFoundException() {
        //Arrange
        String userName = "testUser";

        GuideCreationRequest request = new GuideCreationRequest();
        request.setTitle("Test Guide");
        request.setContent("This is a test guide");
        request.setGuideCategory(GuideCategory.BUREAUCRACY);
        request.setCity(City.SIEGEN);
        request.setUniversity(University.UNI_SIEGEN);
        when(userRepository.findByUsername(userName)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> guideService.createGuide(request, userName));
    }

    @Test
    @DisplayName("Get all approved guides")
    void getAllApprovedGuides() {
        //Arrange
        Guide approvedGuide = buildGuide(1L, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser");

        when(guideRepository.findAll(any(Specification.class))).thenReturn(List.of(approvedGuide));

        //Act
        List<GuideCreationResponse> guides = guideService.getAllApprovedGuides(City.SIEGEN, GuideCategory.BUREAUCRACY, University.UNI_SIEGEN);

        //Assert
        assertEquals(1,guides.size());
        assertEquals("Approved Guide", guides.getFirst().getTitle());
        assertEquals("This is an approved guide", guides.getFirst().getContent());
        assertEquals(GuideCategory.BUREAUCRACY, guides.getFirst().getCategory());
        assertEquals(City.SIEGEN, guides.getFirst().getCity());
        assertEquals(University.UNI_SIEGEN, guides.getFirst().getUniversity());
        assertEquals("testUser", guides.getFirst().getAuthorName());
        assertEquals(GuideStatus.APPROVED, guides.getFirst().getStatus());
    }

    @Test
    @DisplayName("Get all guides for admin")
    void getAllGuidesForAdmin(){
        Guide guide1 = buildGuide(1L, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser");
        Guide guide2 = buildGuide(2L, "Approved Guide2", "This is an approved guide", GuideCategory.HEALTHCARE, GuideStatus.APPROVED, "testUser");

        when(guideRepository.findAll()).thenReturn(List.of(guide1,guide2));

        //Act
        List<GuideCreationResponse> response = guideService.getAllGuidesForAdmin();

        //Assert
        assertEquals(2,response.size());
        assertEquals("Approved Guide",response.get(0).getTitle());
        assertEquals("Approved Guide2",response.get(1).getTitle());
        assertEquals("This is an approved guide",response.get(0).getContent());
        assertEquals("This is an approved guide",response.get(1).getContent());
        assertEquals(GuideCategory.BUREAUCRACY,response.get(0).getCategory());
        assertEquals(GuideCategory.HEALTHCARE,response.get(1).getCategory());
        assertEquals(City.SIEGEN,response.get(0).getCity());
        assertEquals(City.SIEGEN,response.get(1).getCity());
        assertEquals(University.UNI_SIEGEN,response.get(0).getUniversity());
        assertEquals(University.UNI_SIEGEN,response.get(1).getUniversity());
        assertEquals("testUser",response.get(0).getAuthorName());
        assertEquals("testUser",response.get(1).getAuthorName());
    }

    @Test
    @DisplayName("Guest gets an approved guide without a user lookup")
    void getGuideById_approved_guest_returnsGuide() {
        //Arrange
        Long id = 1L;

        when(guideRepository.findById(id)).thenReturn(Optional.of(
                buildGuide(id, "Guide Title", "Guide Content", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser")));

        //Act
        GuideCreationResponse response = guideService.getGuideById(id, null);

        //Assert
        assertEquals(1L, response.getId());
        assertEquals("Guide Title", response.getTitle());
        assertEquals("Guide Content", response.getContent());
        assertEquals(GuideCategory.BUREAUCRACY, response.getCategory());
        assertEquals(City.SIEGEN, response.getCity());
        assertEquals(University.UNI_SIEGEN, response.getUniversity());
        assertEquals("testUser", response.getAuthorName());
        assertEquals(GuideStatus.APPROVED, response.getStatus());
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException since guide is not found")
    void getGuideById_and_throw_ResourceNotFoundException() {
        //Arrange
        Long id = 1L;
        when(guideRepository.findById(id)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> guideService.getGuideById(id, "testUser"));
    }

    @Test
    @DisplayName("Guest gets 404 for a pending guide")
    void getGuideById_pending_guest_throwsNotFound() {
        //Arrange
        Long id = 1L;
        when(guideRepository.findById(id)).thenReturn(Optional.of(
                buildGuide(id, "Guide Title", "Guide Content", GuideCategory.BUREAUCRACY, GuideStatus.PENDING, "testUser")));

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> guideService.getGuideById(id, null));
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Author gets own pending guide without a user lookup")
    void getGuideById_pending_author_returnsGuide() {
        //Arrange
        Long id = 1L;
        when(guideRepository.findById(id)).thenReturn(Optional.of(
                buildGuide(id, "Guide Title", "Guide Content", GuideCategory.BUREAUCRACY, GuideStatus.PENDING, "testUser")));

        //Act
        GuideCreationResponse response = guideService.getGuideById(id, "testUser");

        //Assert
        assertEquals(GuideStatus.PENDING, response.getStatus());
        verifyNoInteractions(userRepository);
    }

    @Test
    @DisplayName("Admin gets someone else's rejected guide incl. the reason")
    void getGuideById_rejected_admin_returnsGuide() {
        //Arrange
        Long id = 1L;
        Guide guide = buildGuide(id, "Guide Title", "Guide Content", GuideCategory.BUREAUCRACY, GuideStatus.REJECTED, "testUser");
        guide.setRejectionReason("Too short");
        User admin = User.builder().username("admin").role(Role.ADMIN).build();

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(admin));

        //Act
        GuideCreationResponse response = guideService.getGuideById(id, "admin");

        //Assert
        assertEquals(GuideStatus.REJECTED, response.getStatus());
        assertEquals("Too short", response.getRejectionReason());
    }

    @Test
    @DisplayName("Another student gets 404 for someone else's pending guide")
    void getGuideById_pending_otherStudent_throwsNotFound() {
        //Arrange
        Long id = 1L;
        User otherStudent = User.builder().username("otherUser").role(Role.STUDENT).build();

        when(guideRepository.findById(id)).thenReturn(Optional.of(
                buildGuide(id, "Guide Title", "Guide Content", GuideCategory.BUREAUCRACY, GuideStatus.PENDING, "testUser")));
        when(userRepository.findByUsername("otherUser")).thenReturn(Optional.of(otherStudent));

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> guideService.getGuideById(id, "otherUser"));
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException since the user from the token no longer exists")
    void getGuideById_pending_unknownUser_throwsNotFound() {
        //Arrange
        Long id = 1L;
        when(guideRepository.findById(id)).thenReturn(Optional.of(
                buildGuide(id, "Guide Title", "Guide Content", GuideCategory.BUREAUCRACY, GuideStatus.PENDING, "testUser")));
        when(userRepository.findByUsername("ghost")).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> guideService.getGuideById(id, "ghost"));
    }

    @Test
    @DisplayName("Get users guides via username")
    void getMyGuides() {
        //Arrange
        String username = "testUser";

        User user = User.builder().username(username).build();

        Guide guide1 = buildGuide(1L, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser");
        Guide guide2 = buildGuide(2L, "Approved Guide2", "This is an approved guide", GuideCategory.HEALTHCARE, GuideStatus.APPROVED, "testUser");

        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(guideRepository.findByAuthor(user)).thenReturn(List.of(guide1,guide2));

        //Act
        List<GuideCreationResponse> response = guideService.getMyGuides(username);

        //Assert
        assertEquals(2,response.size());
        assertEquals("Approved Guide",response.get(0).getTitle());
        assertEquals("Approved Guide2",response.get(1).getTitle());
        assertEquals("This is an approved guide",response.get(0).getContent());
        assertEquals("This is an approved guide",response.get(1).getContent());
        assertEquals(GuideCategory.BUREAUCRACY,response.get(0).getCategory());
        assertEquals(GuideCategory.HEALTHCARE,response.get(1).getCategory());
        assertEquals(City.SIEGEN,response.get(0).getCity());
        assertEquals(City.SIEGEN,response.get(1).getCity());
        assertEquals(University.UNI_SIEGEN,response.get(0).getUniversity());
        assertEquals(University.UNI_SIEGEN,response.get(1).getUniversity());
        assertEquals("testUser",response.get(0).getAuthorName());
        assertEquals("testUser",response.get(1).getAuthorName());
        assertEquals(1L,response.get(0).getId());
        assertEquals(2L,response.get(1).getId());
        assertEquals(GuideStatus.APPROVED,response.get(0).getStatus());
        assertEquals(GuideStatus.APPROVED,response.get(1).getStatus());
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException since user is not found")
    void getMyGuides_and_throw_ResourceNotFoundException() {
        //Arrange
        String username = "testUser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        //Act && Assert
        assertThrows(ResourceNotFoundException.class, () -> guideService.getMyGuides(username));
    }

    @Test
    @DisplayName("Update an existing Guide")
    void updateGuide() {
        //Arrange
        Long id = 1L;

        GuideCreationRequest request = new GuideCreationRequest();
        request.setTitle("Updated Guide");
        request.setContent("This is an updated guide");
        request.setGuideCategory(GuideCategory.BUREAUCRACY);
        request.setCity(City.SIEGEN);
        request.setUniversity(University.UNI_SIEGEN);

        String username = "testUser";

        Guide guide = buildGuide(id, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));
        when(guideRepository.save(guide)).thenReturn(guide);

        //Act
        GuideCreationResponse response = guideService.updateGuide(id,request,username);

        //Assert
        assertEquals("Updated Guide",response.getTitle());
        assertEquals("This is an updated guide",response.getContent());
        assertEquals(GuideCategory.BUREAUCRACY,response.getCategory());
        assertEquals(City.SIEGEN,response.getCity());
        assertEquals(University.UNI_SIEGEN,response.getUniversity());
        assertEquals("testUser",response.getAuthorName());
        assertEquals(GuideStatus.PENDING,response.getStatus());
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException since guide is not found")
    void updateGuide_and_throw_ResourceNotFoundException() {
        // Arrange && Act && Assert
        Long id = 1L;
        GuideCreationRequest request = new GuideCreationRequest();
        String username = "testUser";
        when(guideRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> guideService.updateGuide(id, request, username));
    }

    @Test
    @DisplayName("Throw ForbiddenException since author is not allowed to upgrade guide")
    void updateGuide_and_throw_ForbiddenException() {
        //Arrange
        Long id = 1L;
        GuideCreationRequest request = new GuideCreationRequest();
        String username = "testUser1";

        Guide guide = buildGuide(id, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));

        //Act && Assert
        assertThrows(ForbiddenException.class, () -> guideService.updateGuide(id, request, username));
    }

    @Test
    @DisplayName("Review guide with approved request")
    void reviewGuide_with_approved_request() {
        //Arrange
        Long id = 1L;

        GuideReviewRequest request = new GuideReviewRequest();
        request.setAction(GuideStatus.APPROVED);

        Guide guide = buildGuide(id, "Test Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.PENDING, "testUser");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));
        when(guideRepository.save(guide)).thenReturn(guide);

        //Act
        GuideCreationResponse response = guideService.reviewGuide(id,request);

        //Assert
        assertEquals(GuideStatus.APPROVED,response.getStatus());
        assertEquals(1L,response.getId());
        assertEquals("Test Guide",response.getTitle());
        assertEquals("This is an approved guide",response.getContent());
        assertEquals(GuideCategory.BUREAUCRACY,response.getCategory());
        assertEquals(City.SIEGEN,response.getCity());
        assertEquals(University.UNI_SIEGEN,response.getUniversity());
        assertEquals("testUser",response.getAuthorName());
        assertNull(response.getRejectionReason());
    }

    @Test
    @DisplayName("Review guide with rejected request")
    void reviewGuide_with_rejected_request() {
        //Arrange
        Long id = 1L;

        GuideReviewRequest request = new GuideReviewRequest();
        request.setAction(GuideStatus.REJECTED);
        request.setRejectionReason("This guide is not suitable for you");

        Guide guide = buildGuide(id, "TEST Guide", "This is an rejected guide", GuideCategory.BUREAUCRACY, GuideStatus.PENDING, "testUser");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));
        when(guideRepository.save(guide)).thenReturn(guide);

        //Act
        GuideCreationResponse response = guideService.reviewGuide(id,request);

        //Assert
        assertEquals(GuideStatus.REJECTED,response.getStatus());
        assertEquals("This guide is not suitable for you",response.getRejectionReason());
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException since guide is not found")
    void reviewGuide_and_throw_ResourceNotFoundException() {
        //Arrange && Act && Assert
        Long id = 1L;
        when(guideRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> guideService.reviewGuide(id,new GuideReviewRequest()));
    }

    @Test
    @DisplayName("Throw BadRequestException since rejection reason is null")
    void reviewGuide_and_throw_BadRequestException_for_null_rejection_reason() {
        //Arrange
        Long id = 1L;

        GuideReviewRequest request = new GuideReviewRequest();
        request.setAction(GuideStatus.REJECTED);
        request.setRejectionReason(null);

        Guide guide = buildGuide(id, "Rejected Guide", "This is an rejected guide", GuideCategory.BUREAUCRACY, GuideStatus.REJECTED, "testUser");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));

        //Act && Assert
        assertThrows(BadRequestException.class, () -> guideService.reviewGuide(id,request));
    }

    @Test
    @DisplayName("Throw BadRequestException since invalid action")
    void reviewGuide_and_throw_BadRequestException_for_invalid_action() {
        //Arrange
        Long id = 1L;

        GuideReviewRequest request = new GuideReviewRequest();
        request.setAction(null);
        request.setRejectionReason("This guide is not suitable for you");

        Guide guide = buildGuide(id, "Rejected Guide", "This is an rejected guide", GuideCategory.BUREAUCRACY, GuideStatus.REJECTED, "testUser");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));

        //Act && Assert
        assertThrows(BadRequestException.class, () -> guideService.reviewGuide(id,request));
    }

    @Test
    @DisplayName("Delete a guide")
    void deleteGuide(){
        //Arrange
        Long id = 1L;
        String username = "testUser";
        Guide guide = buildGuide(id, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser");
        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));

        //Act && assert
        guideService.deleteGuide(id,username);
        verify(guideRepository).delete(guide);
    }

    @Test
    @DisplayName("Throw ResourceNotFoundException")
    void deleteGuide_and_throw_ResourceNotFoundException() {
        //Arrange && Act && Assert
        Long id = 1L;
        when(guideRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> guideService.deleteGuide(id,"testUser"));
    }

    @Test
    @DisplayName("Throw ForbiddenException")
    void deleteGuide_and_throw_ForbiddenException() {
        //Arrange
        Long id = 1L;
        String username = "testUser";
        Guide guide = buildGuide(id, "Approved Guide", "This is an approved guide", GuideCategory.BUREAUCRACY, GuideStatus.APPROVED, "testUser1");

        when(guideRepository.findById(id)).thenReturn(Optional.of(guide));

        // Act && Assert
        assertThrows(ForbiddenException.class, () -> guideService.deleteGuide(id,username));
    }
}
