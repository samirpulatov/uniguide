package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.ForumReplyRequest;
import com.samir.uniguide.dto.request.ForumThreadRequest;
import com.samir.uniguide.dto.response.ForumReplyResponse;
import com.samir.uniguide.dto.response.ForumThreadResponse;
import com.samir.uniguide.exception.BadRequestException;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.ForumReply;
import com.samir.uniguide.model.entity.ForumThread;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.ForumReplyRepository;
import com.samir.uniguide.repository.ForumThreadRepository;
import com.samir.uniguide.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ForumServiceTest {
    private static final String AUTHOR = "author";
    private static final String STRANGER = "stranger";

    @Mock
    private ForumThreadRepository forumThreadRepository;
    @Mock
    private ForumReplyRepository forumReplyRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ForumService forumService;

    // ---------- helpers ----------

    private User buildUser(String username) {
        User user = new User();
        user.setUsername(username);
        return user;
    }

    private ForumThread buildThread(Long id, User author) {
        return ForumThread.builder()
                .id(id)
                .author(author)
                .title("Test title")
                .content("Test content")
                .build();
    }

    private ForumReply buildReply(Long id, ForumThread thread, ForumReply parent, User author) {
        return ForumReply.builder()
                .id(id)
                .thread(thread)
                .parentReply(parent)
                .author(author)
                .content("Reply " + id)
                .build();
    }

    private ForumThreadRequest buildThreadRequest(String title, String content) {
        return ForumThreadRequest.builder()
                .title(title)
                .content(content)
                .build();
    }

    // ---------- createThread ----------

    @Test
    @DisplayName("Creates a new thread")
    void createThread() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumThreadRequest request = buildThreadRequest("Test request", "Test content");
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(user));
        when(forumThreadRepository.save(any(ForumThread.class))).thenAnswer(invocation -> invocation.getArgument(0));

        //Act
        ForumThreadResponse response = forumService.createThread(request, AUTHOR);

        //Assert
        assertEquals("Test request", response.getTitle());
        assertEquals("Test content", response.getContent());
        assertEquals(AUTHOR, response.getAuthorName());
    }

    @Test
    @DisplayName("Create thread: unknown user -> ResourceNotFoundException")
    void createThread_userNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> forumService.createThread(buildThreadRequest("t", "c"), AUTHOR));
        verify(forumThreadRepository, never()).save(any());
    }

    // ---------- getAllThreads / getMyThreads ----------

    @Test
    @DisplayName("Get all threads")
    void getAllThreads() {
        //Arrange
        ForumThread thread = buildThread(1L, buildUser(AUTHOR));
        when(forumThreadRepository.findAll(any(Specification.class))).thenReturn(List.of(thread));

        //Act
        List<ForumThreadResponse> threads = forumService.getAllThreads(null, null, null);

        //Assert
        assertEquals(1, threads.size());
        ForumThreadResponse response = threads.getFirst();
        assertEquals(1L, response.getId());
        assertEquals(AUTHOR, response.getAuthorName());
        assertEquals("Test title", response.getTitle());
        assertEquals("Test content", response.getContent());
        // list view never loads replies
        assertNull(response.getReplies());
    }

    @Test
    @DisplayName("Get threads of the current user")
    void getMyThreads() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumThread thread = buildThread(1L, user);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(user));
        when(forumThreadRepository.findByAuthor(user)).thenReturn(List.of(thread));

        //Act
        List<ForumThreadResponse> response = forumService.getMyThreads(AUTHOR);

        //Assert
        assertEquals(1, response.size());
        assertEquals(thread.getTitle(), response.getFirst().getTitle());
        assertEquals(thread.getContent(), response.getFirst().getContent());
        assertEquals(AUTHOR, response.getFirst().getAuthorName());
    }

    @Test
    @DisplayName("Get my threads: unknown user -> ResourceNotFoundException")
    void getMyThreads_userNotFound() {
        //Arrange
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> forumService.getMyThreads(AUTHOR));
    }

    // ---------- updateThread ----------

    @Test
    @DisplayName("Update thread")
    void updateThread() {
        //Arrange
        ForumThread thread = buildThread(1L, buildUser(AUTHOR));
        ForumThreadRequest request = buildThreadRequest("Updated title", "Updated content");
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(forumThreadRepository.save(any(ForumThread.class))).thenAnswer(invocation -> invocation.getArgument(0));

        //Act
        ForumThreadResponse response = forumService.updateThread(1L, request, AUTHOR);

        //Assert
        assertEquals("Updated title", response.getTitle());
        assertEquals("Updated content", response.getContent());
    }

    @Test
    @DisplayName("Update thread: not the author -> ForbiddenException")
    void updateThread_notAuthor() {
        //Arrange
        ForumThread thread = buildThread(1L, buildUser(AUTHOR));
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));

        //Act & Assert
        assertThrows(ForbiddenException.class,
                () -> forumService.updateThread(1L, buildThreadRequest("t", "c"), STRANGER));
        verify(forumThreadRepository, never()).save(any());
        // entity must stay untouched
        assertEquals("Test title", thread.getTitle());
    }

    @Test
    @DisplayName("Update thread: thread not found -> ResourceNotFoundException")
    void updateThread_notFound() {
        //Arrange
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> forumService.updateThread(1L, buildThreadRequest("t", "c"), AUTHOR));
        verify(forumThreadRepository, never()).save(any());
    }

    // ---------- deleteThread ----------

    @Test
    @DisplayName("Delete thread")
    void deleteThread() {
        //Arrange
        ForumThread thread = buildThread(1L, buildUser(AUTHOR));
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));

        //Act
        forumService.deleteThread(1L, AUTHOR);

        //Assert
        verify(forumThreadRepository).delete(thread);
    }

    @Test
    @DisplayName("Delete thread: not the author -> ForbiddenException")
    void deleteThread_notAuthor() {
        //Arrange
        ForumThread thread = buildThread(1L, buildUser(AUTHOR));
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));

        //Act & Assert
        assertThrows(ForbiddenException.class, () -> forumService.deleteThread(1L, STRANGER));
        verify(forumThreadRepository, never()).delete((ForumThread) any());
    }

    @Test
    @DisplayName("Delete thread: thread not found -> ResourceNotFoundException")
    void deleteThread_notFound() {
        //Arrange
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> forumService.deleteThread(1L, AUTHOR));
        verify(forumThreadRepository, never()).delete((ForumThread) any());
    }

    // ---------- getThreadById (reply tree) ----------

    @Test
    @DisplayName("Get thread by id: thread without replies -> empty list, not null")
    void getThreadById_noReplies() {
        //Arrange
        ForumThread thread = buildThread(1L, buildUser(AUTHOR));
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(forumReplyRepository.findByThreadOrderByCreatedAtAsc(thread)).thenReturn(List.of());

        //Act
        ForumThreadResponse response = forumService.getThreadById(1L);

        //Assert
        assertEquals(1L, response.getId());
        assertTrue(response.getReplies().isEmpty());
    }

    @Test
    @DisplayName("Get thread by id: builds a multi-level reply tree")
    void getThreadById_buildsTree() {
        //Arrange
        // tree:
        //   r1
        //   ├── r2
        //   │   └── r4
        //   └── r3
        //   r5
        User user = buildUser(AUTHOR);
        ForumThread thread = buildThread(1L, user);
        ForumReply r1 = buildReply(1L, thread, null, user);
        ForumReply r2 = buildReply(2L, thread, r1, user);
        ForumReply r3 = buildReply(3L, thread, r1, user);
        ForumReply r4 = buildReply(4L, thread, r2, user);
        ForumReply r5 = buildReply(5L, thread, null, user);

        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        // flat list in createdAt order, exactly what the repository returns
        when(forumReplyRepository.findByThreadOrderByCreatedAtAsc(thread))
                .thenReturn(List.of(r1, r2, r3, r4, r5));

        //Act
        ForumThreadResponse response = forumService.getThreadById(1L);

        //Assert
        // only roots on top level, in original order
        List<ForumReplyResponse> roots = response.getReplies();
        assertEquals(List.of(1L, 5L), roots.stream().map(ForumReplyResponse::getId).toList());

        // r1 -> [r2, r3], order kept
        ForumReplyResponse resp1 = roots.get(0);
        assertEquals(List.of(2L, 3L), resp1.getReplies().stream().map(ForumReplyResponse::getId).toList());

        // r2 -> [r4] (third level)
        ForumReplyResponse resp2 = resp1.getReplies().get(0);
        assertEquals(List.of(4L), resp2.getReplies().stream().map(ForumReplyResponse::getId).toList());

        // leaves get an empty list, not null
        ForumReplyResponse resp3 = resp1.getReplies().get(1);
        ForumReplyResponse resp4 = resp2.getReplies().get(0);
        ForumReplyResponse resp5 = roots.get(1);
        assertTrue(resp3.getReplies().isEmpty());
        assertTrue(resp4.getReplies().isEmpty());
        assertTrue(resp5.getReplies().isEmpty());

        // mapping of a single node
        assertEquals("Reply 4", resp4.getContent());
        assertEquals(AUTHOR, resp4.getAuthorName());
    }

    @Test
    @DisplayName("Get thread by id: deleted reply hides its author, its children keep theirs")
    void getThreadById_deletedReplyHidesAuthor() {
        //Arrange
        // tree:
        //   r1 (deleted)
        //   └── r2
        User user = buildUser(AUTHOR);
        ForumThread thread = buildThread(1L, user);
        ForumReply r1 = buildReply(1L, thread, null, user);
        r1.setDeleted(true);
        ForumReply r2 = buildReply(2L, thread, r1, user);

        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(forumReplyRepository.findByThreadOrderByCreatedAtAsc(thread)).thenReturn(List.of(r1, r2));

        //Act
        ForumThreadResponse response = forumService.getThreadById(1L);

        //Assert
        ForumReplyResponse deleted = response.getReplies().getFirst();
        assertTrue(deleted.isDeleted());
        assertNull(deleted.getAuthorName());

        // the child is not deleted, so its author is still shown
        ForumReplyResponse child = deleted.getReplies().getFirst();
        assertFalse(child.isDeleted());
        assertEquals(AUTHOR, child.getAuthorName());
    }

    @Test
    @DisplayName("Get thread by id: thread not found -> ResourceNotFoundException")
    void getThreadById_notFound() {
        //Arrange
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> forumService.getThreadById(1L));
    }

    // ---------- createReply ----------

    @Test
    @DisplayName("Create reply: top-level reply (no parent)")
    void createReply_topLevel() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumThread thread = buildThread(1L, user);
        ForumReplyRequest request = new ForumReplyRequest("Hello", null);
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(user));

        //Act
        ForumReplyResponse response = forumService.createReply(1L, request, AUTHOR);

        //Assert
        ArgumentCaptor<ForumReply> captor = ArgumentCaptor.forClass(ForumReply.class);
        verify(forumReplyRepository).save(captor.capture());
        ForumReply saved = captor.getValue();
        assertSame(thread, saved.getThread());
        assertSame(user, saved.getAuthor());
        assertNull(saved.getParentReply());
        assertFalse(saved.isDeleted());

        assertEquals("Hello", response.getContent());
        assertEquals(AUTHOR, response.getAuthorName());
    }

    @Test
    @DisplayName("Create reply: nested under a parent from the same thread")
    void createReply_withParent() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumThread thread = buildThread(1L, user);
        ForumReply parent = buildReply(10L, thread, null, user);
        ForumReplyRequest request = new ForumReplyRequest("Nested", 10L);
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(user));
        when(forumReplyRepository.findById(10L)).thenReturn(Optional.of(parent));

        //Act
        forumService.createReply(1L, request, AUTHOR);

        //Assert
        ArgumentCaptor<ForumReply> captor = ArgumentCaptor.forClass(ForumReply.class);
        verify(forumReplyRepository).save(captor.capture());
        assertSame(parent, captor.getValue().getParentReply());
    }

    @Test
    @DisplayName("Create reply: parent belongs to another thread -> BadRequestException")
    void createReply_parentFromOtherThread() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumThread thread = buildThread(1L, user);
        ForumThread otherThread = buildThread(2L, user);
        ForumReply foreignParent = buildReply(10L, otherThread, null, user);
        ForumReplyRequest request = new ForumReplyRequest("Nested", 10L);
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(thread));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(user));
        when(forumReplyRepository.findById(10L)).thenReturn(Optional.of(foreignParent));

        //Act & Assert
        assertThrows(BadRequestException.class, () -> forumService.createReply(1L, request, AUTHOR));
        verify(forumReplyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create reply: thread not found -> ResourceNotFoundException")
    void createReply_threadNotFound() {
        //Arrange
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> forumService.createReply(1L, new ForumReplyRequest("c", null), AUTHOR));
        verify(forumReplyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create reply: user not found -> ResourceNotFoundException")
    void createReply_userNotFound() {
        //Arrange
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(buildThread(1L, buildUser(AUTHOR))));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> forumService.createReply(1L, new ForumReplyRequest("c", null), AUTHOR));
        verify(forumReplyRepository, never()).save(any());
    }

    @Test
    @DisplayName("Create reply: parent reply not found -> ResourceNotFoundException")
    void createReply_parentNotFound() {
        //Arrange
        User user = buildUser(AUTHOR);
        when(forumThreadRepository.findById(1L)).thenReturn(Optional.of(buildThread(1L, user)));
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(user));
        when(forumReplyRepository.findById(10L)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class,
                () -> forumService.createReply(1L, new ForumReplyRequest("c", 10L), AUTHOR));
        verify(forumReplyRepository, never()).save(any());
    }

    // ---------- deleteReply ----------

    @Test
    @DisplayName("Delete reply: soft delete keeps the row, replaces content")
    void deleteReply() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumReply reply = buildReply(10L, buildThread(1L, user), null, user);
        when(forumReplyRepository.findById(10L)).thenReturn(Optional.of(reply));

        //Act
        forumService.deleteReply(10L, AUTHOR);

        //Assert
        verify(forumReplyRepository).save(reply);
        verify(forumReplyRepository, never()).delete(any());
        assertEquals("deleted", reply.getContent());
        assertTrue(reply.isDeleted());
    }

    @Test
    @DisplayName("Delete reply: not the author -> ForbiddenException")
    void deleteReply_notAuthor() {
        //Arrange
        User user = buildUser(AUTHOR);
        ForumReply reply = buildReply(10L, buildThread(1L, user), null, user);
        when(forumReplyRepository.findById(10L)).thenReturn(Optional.of(reply));

        //Act & Assert
        assertThrows(ForbiddenException.class, () -> forumService.deleteReply(10L, STRANGER));
        verify(forumReplyRepository, never()).save(any());
        assertFalse(reply.isDeleted());
    }

    @Test
    @DisplayName("Delete reply: reply not found -> ResourceNotFoundException")
    void deleteReply_notFound() {
        //Arrange
        when(forumReplyRepository.findById(10L)).thenReturn(Optional.empty());

        //Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> forumService.deleteReply(10L, AUTHOR));
        verify(forumReplyRepository, never()).save(any());
    }
}
