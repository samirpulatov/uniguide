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
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;


import java.util.List;


/**
 * Personal to-do list for the dashboard.
 * Each user has exactly one list (there is no TodoList entity), so every method
 * works only with the tasks of the current user. The user always comes from the JWT
 * via {@link Authentication}, never from the URL or the request body.
 */
@Service
public class TodoTaskService {
    private final TodoTaskRepository todoTaskRepository;
    private final UserRepository userRepository;

    public TodoTaskService(TodoTaskRepository todoTaskRepository, UserRepository userRepository) {
        this.todoTaskRepository = todoTaskRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates a new task for the current user.
     * {@code completed} starts as false and {@code createdAt} is set by Hibernate on insert.
     *
     * @param request        task text (already validated: not blank, max 100 chars)
     * @param authentication current user from the JWT
     * @return the saved task
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public TodoTaskResponse createTodoTask(TodoTaskCreationRequest request, Authentication authentication) {
        User author  = userRepository.findByUsername(authentication.getName()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        TodoTask todoTask = TodoTask.builder()
                .content(request.getContent())
                .author(author)
                .build();

        TodoTask createdTodoTask = todoTaskRepository.save(todoTask);

        return toTodoTaskResponse(createdTodoTask);
    }

    /**
     * Returns all tasks of the current user, oldest first.
     * The database does the sorting, so new tasks appear at the bottom of the list.
     *
     * @param authentication current user from the JWT
     * @return the user's tasks; an empty list if there are none
     * @throws ResourceNotFoundException if the user from the token no longer exists
     */
    public List<TodoTaskResponse>
    getTodoTasksByAuthor(Authentication authentication) {
        User author = userRepository.findByUsername(authentication.getName()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return todoTaskRepository.findByAuthorOrderByCreatedAtAsc(author).stream().map(TodoTaskService::toTodoTaskResponse).toList();
    }

    /**
     * Partial update (PATCH): only the fields that are present in the request are changed.
     * A field that is {@code null} means "do not touch it". So {@code {"completed": true}}
     * only ticks the task, and {@code {"content": "..."}} only changes the text.
     *
     * @param id             id of the task from the URL
     * @param request        fields to change; each one may be null
     * @param authentication current user from the JWT
     * @return the task after the update
     * @throws ResourceNotFoundException if the task does not exist
     * @throws ForbiddenException        if the task belongs to another user
     * @throws BadRequestException       if content is sent but contains only whitespace
     */
    public TodoTaskResponse updateTodoTask(Long id, UpdateTodoTaskRequest request, Authentication authentication) {
        TodoTask todoTask = getOwnedTodoTask(id, authentication);
        // null check first: a toggle request has no content, and isBlank() on null would throw NPE
        if(request.getContent()!=null) {
            // @Size in the DTO does not catch "   ", so a blank text is rejected here with 400
            if(request.getContent().isBlank()) {
                throw new BadRequestException("TodoTask's content cannot be empty");
            }
            todoTask.setContent(request.getContent());
        }
        // use the sent value, not a fixed true, so the user can also un-tick a task
        if(request.getCompleted()!=null) {
            todoTask.setCompleted(request.getCompleted());
        }
        TodoTask updatedTodoTask = todoTaskRepository.save(todoTask);
        return toTodoTaskResponse(updatedTodoTask);
    }


    /**
     * Deletes a task of the current user. Any own task can be deleted,
     * it does not have to be completed first (e.g. a task that is no longer needed).
     *
     * @param id             id of the task from the URL
     * @param authentication current user from the JWT
     * @throws ResourceNotFoundException if the task does not exist
     * @throws ForbiddenException        if the task belongs to another user
     */
    public void deleteTodoTask(Long id, Authentication authentication) {
        TodoTask todoTask = getOwnedTodoTask(id, authentication);

        todoTaskRepository.delete(todoTask);

    }


    // loads a task and makes sure it belongs to the current user; shared by update and delete,
    // so the ownership check lives in one place. Without it anyone could change a task just by guessing its id
    private TodoTask getOwnedTodoTask(Long id, Authentication authentication) {
        User author = userRepository.findByUsername(authentication.getName()).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // load the task first: the real owner is known only from the DB, never trust the client for it
        TodoTask todoTask = todoTaskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("TodoTask not found"));
        // author is LAZY, but getId() on the proxy does not trigger an extra query
        if(!todoTask.getAuthor().getId().equals(author.getId())) {
            throw new ForbiddenException("You are not allowed to perform this action");
        }

        return todoTask;
    }


    // entity -> DTO; author is left out because all tasks in the list belong to the current user anyway
    private static TodoTaskResponse toTodoTaskResponse(TodoTask todoTask) {
        return TodoTaskResponse.builder()
                .id(todoTask.getId())
                .content(todoTask.getContent())
                .completed(todoTask.isCompleted())
                .createdAt(todoTask.getCreatedAt())
                .build();
    }
}
