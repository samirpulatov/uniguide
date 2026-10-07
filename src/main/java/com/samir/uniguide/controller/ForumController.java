package com.samir.uniguide.controller;


import com.samir.uniguide.dto.request.ForumReplyRequest;
import com.samir.uniguide.dto.request.ForumThreadRequest;
import com.samir.uniguide.dto.response.ForumReplyResponse;
import com.samir.uniguide.dto.response.ForumThreadResponse;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.ForumCategory;
import com.samir.uniguide.model.enums.University;
import com.samir.uniguide.service.ForumService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * HTTP layer for the forum: threads and their replies.
 * <p>
 * Unlike guides, forum content has no moderation — it is visible right after it is created.
 * This controller stays thin: it only reads the request, takes the current username
 * from the JWT ({@link Authentication#getName()}) and passes everything to {@link ForumService}.
 * Author checks (only the author may edit/delete) live in the service, not here.
 * <p>
 * Read endpoints (list, single thread) are public; everything else needs a token.
 * The access rules themselves are defined in {@code SecurityConfig}.
 */
@Tag(name = "Forum", description = "Create, get, update and delete threads/replies")
@RestController
@RequestMapping("/forum")
public class ForumController {
    private final ForumService forumService;
    public ForumController(ForumService forumService) {
        this.forumService = forumService;
    }

    /**
     * Opens a new discussion thread. The author is the current user, taken from the JWT —
     * never from the request, so nobody can post in someone else's name.
     *
     * @param forumThreadRequest thread data; validated with {@code @Valid}, so a blank title/content returns 400
     * @return the created thread with status 201 (Created)
     */
    @Operation(summary = "create a new thread", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/threads")
    public ResponseEntity<ForumThreadResponse> createThread(@Valid @RequestBody ForumThreadRequest forumThreadRequest, Authentication authentication) {
        return ResponseEntity.status(201).body(forumService.createThread(forumThreadRequest, authentication.getName()));
    }

    /**
     * Public list of threads with optional filters. Replies are not included here —
     * they are loaded only when a single thread is opened.
     * <p>
     * All filters are optional ({@code required = false}): a missing param arrives as {@code null},
     * and the service simply skips that filter. No params = all threads.
     *
     * @param category named {@code category} (not {@code forumCategory}) so the query param is {@code ?category=},
     *                 the same name the guides endpoint and the frontend use
     */
    @Operation(summary = "get all threads")
    @GetMapping("/threads")
    public ResponseEntity<List<ForumThreadResponse>> getAllThreads(@RequestParam(required = false) City city, @RequestParam(required = false) University university,
                                                                   @RequestParam(required = false) ForumCategory category) {
        return ResponseEntity.ok(forumService.getAllThreads(city, university, category));
    }


    /**
     * Threads created by the current user.
     * <p>
     * Spring MVC prefers the literal path {@code /threads/me} over the template {@code /threads/{id}},
     * so "me" is never parsed as an id. In {@code SecurityConfig} this path must be marked
     * {@code authenticated()} <b>before</b> the public {@code /forum/threads/**} rule —
     * otherwise {@code authentication} would be {@code null} here and {@code getName()} would throw an NPE.
     */
    @Operation(summary = "get all threads for one user", security = @SecurityRequirement(name = "bearerAuth"))
    @GetMapping("/threads/me")
    public ResponseEntity<List<ForumThreadResponse>> getAllThreadsForUser(Authentication authentication) {
        return ResponseEntity.ok(forumService.getMyThreads(authentication.getName()));
    }


    /**
     * Updates a thread. Only its author may do this — the service checks it and throws
     * {@code ForbiddenException} (403) otherwise.
     *
     * @param id id of the thread to update
     * @return the updated thread with status 200
     */
    @Operation(summary = "update thread", security = @SecurityRequirement(name = "bearerAuth"))
    @PutMapping("/threads/{id}")
    public ResponseEntity<ForumThreadResponse> updateThread(@PathVariable Long id, @Valid @RequestBody ForumThreadRequest forumThreadRequest, Authentication authentication) {
        return ResponseEntity.ok(forumService.updateThread(id, forumThreadRequest, authentication.getName()));
    }

    /**
     * Deletes a thread for good (hard delete), author only.
     * All its replies are removed too — the database cascades the delete,
     * so nothing needs to be cleaned up here.
     *
     * @return 204 (No Content) — there is nothing left to return
     */
    @Operation(summary = "delete a thread", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/threads/{id}")
    public ResponseEntity<Void> deleteThread(@PathVariable Long id, Authentication authentication) {
        forumService.deleteThread(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Public: one thread together with its full reply tree (replies nested inside their parent replies).
     * It is public because the result is the same for every reader and contains no private data
     * — and a public thread list would be useless if opening a thread required a login.
     */
    @Operation(summary = "get thread by id")
    @GetMapping("/threads/{id}")
    public ResponseEntity<ForumThreadResponse> getThreadById(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getThreadById(id));
    }


    /**
     * Adds a reply to a thread. The path is nested under the thread
     * because a reply always belongs to one thread.
     * <p>
     * To answer another reply (not the thread itself), the client sends {@code parentReplyId} in the body.
     * That parent must be in the same thread, otherwise the service returns 400.
     *
     * @param threadId id of the thread the reply goes into
     * @return the created reply with status 201 (Created)
     */
    @Operation(summary = "create a reply", security = @SecurityRequirement(name = "bearerAuth"))
    @PostMapping("/threads/{threadId}/replies")
    public ResponseEntity<ForumReplyResponse> createReply(@PathVariable Long threadId,
                                                          @Valid @RequestBody ForumReplyRequest forumReplyRequest, Authentication authentication) {
        return ResponseEntity.status(201).body(forumService.createReply(threadId, forumReplyRequest, authentication.getName()));
    }

    /**
     * Deletes a reply, author only. This is a soft delete: the reply stays in the database,
     * but its content is replaced and it is marked as deleted. This keeps the reply tree intact,
     * so answers to this reply still make sense.
     *
     * @param replyId id of the reply (not of the thread)
     * @return 204 (No Content)
     */
    @Operation(summary = "delete a reply", security = @SecurityRequirement(name = "bearerAuth"))
    @DeleteMapping("/replies/{replyId}")
    public ResponseEntity<Void> deleteReply(@PathVariable Long replyId, Authentication authentication) {
        forumService.deleteReply(replyId, authentication.getName());
        return ResponseEntity.noContent().build();
    }


}
