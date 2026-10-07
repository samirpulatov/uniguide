package com.samir.uniguide.controller;


import com.samir.uniguide.dto.request.TodoTaskCreationRequest;
import com.samir.uniguide.dto.request.UpdateTodoTaskRequest;
import com.samir.uniguide.dto.response.TodoTaskResponse;
import com.samir.uniguide.service.TodoTaskService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Todo tasks", description = "Create, get, update and delete todo tasks")
@RestController
@RequestMapping("/todos")
public class TodoTaskController {
    private final TodoTaskService todoTaskService;


    public TodoTaskController(TodoTaskService todoTaskService) {
        this.todoTaskService = todoTaskService;
    }

    @PostMapping
    public ResponseEntity<TodoTaskResponse> createTodoTask(@Valid @RequestBody TodoTaskCreationRequest request, Authentication authentication) {
        return ResponseEntity.status(201).body(todoTaskService.createTodoTask(request, authentication.getName()));
    }

    @GetMapping
    public ResponseEntity<List<TodoTaskResponse>> getTodoTasks(Authentication authentication) {
        return ResponseEntity.ok(todoTaskService.getTodoTasksByAuthor(authentication.getName()));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<TodoTaskResponse> updateTodoTask(@PathVariable Long id, @Valid @RequestBody UpdateTodoTaskRequest request, Authentication authentication) {
        return ResponseEntity.ok(todoTaskService.updateTodoTask(id, request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodoTask(@PathVariable Long id, Authentication authentication) {
        todoTaskService.deleteTodoTask(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
