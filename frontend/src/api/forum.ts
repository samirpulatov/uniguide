import { apiClient } from './client';
import type {
  City,
  ForumCategory,
  ForumReplyRequest,
  ForumReplyResponse,
  ForumThreadRequest,
  ForumThreadResponse,
  University,
} from '../types';

// Query param is `category` (not `forumCategory`) — see ForumController#getAllThreads
export interface ForumFilters {
  city?: City;
  category?: ForumCategory;
  university?: University;
}

export const forumApi = {
  getThreads: (filters: ForumFilters = {}) =>
    apiClient
      .get<ForumThreadResponse[]>('/forum/threads', { params: filters })
      .then((r) => r.data),

  getMyThreads: () =>
    apiClient.get<ForumThreadResponse[]>('/forum/threads/me').then((r) => r.data),

  // includes the full nested reply tree
  getThread: (id: number) =>
    apiClient.get<ForumThreadResponse>(`/forum/threads/${id}`).then((r) => r.data),

  createThread: (request: ForumThreadRequest) =>
    apiClient.post<ForumThreadResponse>('/forum/threads', request).then((r) => r.data),

  updateThread: (id: number, request: ForumThreadRequest) =>
    apiClient.put<ForumThreadResponse>(`/forum/threads/${id}`, request).then((r) => r.data),

  deleteThread: (id: number) =>
    apiClient.delete<void>(`/forum/threads/${id}`).then((r) => r.data),

  createReply: (threadId: number, request: ForumReplyRequest) =>
    apiClient
      .post<ForumReplyResponse>(`/forum/threads/${threadId}/replies`, request)
      .then((r) => r.data),

  // soft delete: the reply stays in the tree with tombstone content
  deleteReply: (replyId: number) =>
    apiClient.delete<void>(`/forum/replies/${replyId}`).then((r) => r.data),
};
