import { apiClient } from './client';
import type { TodoTaskCreationRequest, TodoTaskResponse, UpdateTodoTaskRequest } from '../types';

// All endpoints work with the current user's list only — the user comes from the JWT, never from the URL
export const todosApi = {
  // oldest first: the backend sorts by createdAt, so new tasks end up at the bottom
  getTodos: () => apiClient.get<TodoTaskResponse[]>('/todos').then((r) => r.data),

  createTodo: (request: TodoTaskCreationRequest) =>
    apiClient.post<TodoTaskResponse>('/todos', request).then((r) => r.data),

  updateTodo: (id: number, request: UpdateTodoTaskRequest) =>
    apiClient.patch<TodoTaskResponse>(`/todos/${id}`, request).then((r) => r.data),

  deleteTodo: (id: number) => apiClient.delete<void>(`/todos/${id}`).then((r) => r.data),
};
