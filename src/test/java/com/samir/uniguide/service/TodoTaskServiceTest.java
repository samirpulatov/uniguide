package com.samir.uniguide.service;

import com.samir.uniguide.dto.request.TodoTaskCreationRequest;
import com.samir.uniguide.dto.request.UpdateTodoTaskRequest;
import com.samir.uniguide.dto.response.TodoTaskResponse;
import com.samir.uniguide.exception.BadRequestException;
import com.samir.uniguide.exception.ForbiddenException;
import com.samir.uniguide.exception.ResourceNotFoundException;
import com.samir.uniguide.model.entity.TodoTask;
import com.samir.uniguide.model.entity.User;
import com.samir.uniguide.repository.TodoTaskRepository;
import com.samir.uniguide.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class TodoTaskServiceTest {
    private static final String AUTHOR = "author";
    private static final String STRANGER = "stranger";

    @Mock
    private TodoTaskRepository todoTaskRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TodoTaskService todoTaskService;

    // ---------- helpers ----------

    // the ownership check compares ids, so every user needs one
    private User buildUser(String username) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setUsername(username);
        return user;
    }

    private TodoTask buildTask(Long id, User author, String content, boolean completed) {
        return TodoTask.builder()
                .id(id)
                .author(author)
                .content(content)
                .completed(completed)
                .build();
    }

    private UpdateTodoTaskRequest buildUpdateRequest(String content, Boolean completed) {
        UpdateTodoTaskRequest request = new UpdateTodoTaskRequest();
        request.setContent(content);
        request.setCompleted(completed);
        return request;
    }

    // ---------- createTodoTask ----------

    @Test
    @DisplayName("createTodoTask saves a not completed task owned by the current user")
    void createTodoTask_savesTaskForCurrentUser() {
        User author = buildUser(AUTHOR);
        TodoTaskCreationRequest request = new TodoTaskCreationRequest();
        request.setContent("buy milk");
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.save(any(TodoTask.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TodoTaskResponse result = todoTaskService.createTodoTask(request, AUTHOR);

        // check what actually went to the DB, not only the response
        ArgumentCaptor<TodoTask> captor = ArgumentCaptor.forClass(TodoTask.class);
        verify(todoTaskRepository).save(captor.capture());
        TodoTask saved = captor.getValue();
        assertEquals("buy milk", saved.getContent());
        assertSame(author, saved.getAuthor());
        assertFalse(saved.isCompleted());

        assertEquals("buy milk", result.getContent());
        assertFalse(result.isCompleted());
    }

    @Test
    @DisplayName("createTodoTask throws 404 and saves nothing when the user from the token does not exist")
    void createTodoTask_unknownUser_throwsNotFound() {
        TodoTaskCreationRequest request = new TodoTaskCreationRequest();
        request.setContent("buy milk");
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> todoTaskService.createTodoTask(request, AUTHOR));

        verify(todoTaskRepository, never()).save(any());
    }

    // ---------- getTodoTasksByAuthor ----------

    @Test
    @DisplayName("getTodoTasksByAuthor maps the user's tasks to responses in repository order")
    void getTodoTasksByAuthor_returnsMappedTasks() {
        User author = buildUser(AUTHOR);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.findByAuthorOrderByCreatedAtAsc(author)).thenReturn(List.of(
                buildTask(1L, author, "first", false),
                buildTask(2L, author, "second", true)));

        List<TodoTaskResponse> result = todoTaskService.getTodoTasksByAuthor(AUTHOR);

        assertEquals(2, result.size());
        assertEquals("first", result.get(0).getContent());
        assertTrue(result.get(1).isCompleted());
    }

    // ---------- updateTodoTask ----------

    @Test
    @DisplayName("updateTodoTask throws 403 and saves nothing when the task belongs to another user")
    void updateTodoTask_notOwner_throwsForbidden() {
        User author = buildUser(AUTHOR);
        User stranger = buildUser(STRANGER);
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(stranger));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(buildTask(1L, author, "task", false)));

        assertThrows(ForbiddenException.class,
                () -> todoTaskService.updateTodoTask(1L, buildUpdateRequest("hacked", null), STRANGER));

        verify(todoTaskRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateTodoTask throws 404 when the task does not exist")
    void updateTodoTask_missingTask_throwsNotFound() {
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(buildUser(AUTHOR)));
        when(todoTaskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> todoTaskService.updateTodoTask(99L, buildUpdateRequest(null, true), AUTHOR));
    }

    @Test
    @DisplayName("updateTodoTask with only completed set ticks the task and keeps the content")
    void updateTodoTask_onlyCompleted_keepsContent() {
        User author = buildUser(AUTHOR);
        TodoTask task = buildTask(1L, author, "buy milk", false);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(todoTaskRepository.save(task)).thenReturn(task);

        TodoTaskResponse result = todoTaskService.updateTodoTask(1L, buildUpdateRequest(null, true), AUTHOR);

        assertTrue(result.isCompleted());
        assertEquals("buy milk", result.getContent());
    }

    @Test
    @DisplayName("updateTodoTask with only content set changes the text and keeps completed")
    void updateTodoTask_onlyContent_keepsCompleted() {
        User author = buildUser(AUTHOR);
        TodoTask task = buildTask(1L, author, "old", true);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(todoTaskRepository.save(task)).thenReturn(task);

        TodoTaskResponse result = todoTaskService.updateTodoTask(1L, buildUpdateRequest("new", null), AUTHOR);

        assertEquals("new", result.getContent());
        assertTrue(result.isCompleted());
    }

    @Test
    @DisplayName("updateTodoTask with completed = false un-ticks a completed task")
    void updateTodoTask_completedFalse_unticksTask() {
        User author = buildUser(AUTHOR);
        TodoTask task = buildTask(1L, author, "task", true);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(task));
        when(todoTaskRepository.save(task)).thenReturn(task);

        TodoTaskResponse result = todoTaskService.updateTodoTask(1L, buildUpdateRequest(null, false), AUTHOR);

        assertFalse(result.isCompleted());
    }

    @Test
    @DisplayName("updateTodoTask throws 400 and saves nothing when content is blank")
    void updateTodoTask_blankContent_throwsBadRequest() {
        User author = buildUser(AUTHOR);
        TodoTask task = buildTask(1L, author, "task", false);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(task));

        assertThrows(BadRequestException.class,
                () -> todoTaskService.updateTodoTask(1L, buildUpdateRequest("   ", null), AUTHOR));

        assertEquals("task", task.getContent());
        verify(todoTaskRepository, never()).save(any());
    }

    // ---------- deleteTodoTask ----------

    @Test
    @DisplayName("deleteTodoTask deletes the owner's task")
    void deleteTodoTask_owner_deletes() {
        User author = buildUser(AUTHOR);
        TodoTask task = buildTask(1L, author, "task", false);
        when(userRepository.findByUsername(AUTHOR)).thenReturn(Optional.of(author));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(task));

        todoTaskService.deleteTodoTask(1L, AUTHOR);

        verify(todoTaskRepository).delete(task);
    }

    @Test
    @DisplayName("deleteTodoTask throws 403 and deletes nothing when the task belongs to another user")
    void deleteTodoTask_notOwner_throwsForbidden() {
        User author = buildUser(AUTHOR);
        User stranger = buildUser(STRANGER);
        when(userRepository.findByUsername(STRANGER)).thenReturn(Optional.of(stranger));
        when(todoTaskRepository.findById(1L)).thenReturn(Optional.of(buildTask(1L, author, "task", false)));

        assertThrows(ForbiddenException.class, () -> todoTaskService.deleteTodoTask(1L, STRANGER));

        verify(todoTaskRepository, never()).delete(any());
    }
}
