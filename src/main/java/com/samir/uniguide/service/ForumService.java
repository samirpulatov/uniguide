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
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.ForumCategory;
import com.samir.uniguide.model.enums.University;
import com.samir.uniguide.repository.ForumReplyRepository;
import com.samir.uniguide.repository.ForumThreadRepository;
import com.samir.uniguide.repository.ForumThreadSpecification;
import com.samir.uniguide.repository.UserRepository;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;



import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// forum thread + reply CRUD; deliberately no moderation, unlike GuideService — content is visible immediately
@Service
public class ForumService {

    private final ForumThreadRepository forumThreadRepository;
    private final ForumReplyRepository forumReplyRepository;
    private final UserRepository userRepository;
    public ForumService(ForumThreadRepository forumThreadRepository, ForumReplyRepository forumReplyRepository, UserRepository userRepository) {
        this.forumThreadRepository = forumThreadRepository;
        this.forumReplyRepository = forumReplyRepository;
        this.userRepository = userRepository;
    }

    // author = current user (username comes from the JWT via Authentication.getName())
    public ForumThreadResponse createThread(ForumThreadRequest request, String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        ForumThread thread = ForumThread.builder()
                .author(user)
                .title(request.getTitle())
                .content(request.getContent())
                .city(request.getCity())
                .university(request.getUniversity())
                .forumCategory(request.getForumCategory())
                .build();

        ForumThread savedThread = forumThreadRepository.save(thread);

        return toForumThreadResponse(savedThread);
    }

    // list view: replies are NOT loaded here (stay null) — only getThreadById builds the reply tree
    public List<ForumThreadResponse> getAllThreads(City city, University university, ForumCategory forumCategory) {
        // each null param returns a null predicate, which Specification simply skips
        Specification<ForumThread> spec = Specification
                .where(ForumThreadSpecification.hasCity(city))
                .and(ForumThreadSpecification.hasUniversity(university))
                .and(ForumThreadSpecification.hasCategory(forumCategory));

        return forumThreadRepository.findAll(spec)
                .stream()
                .map(this::toForumThreadResponse)
                .toList();

    }

    public List<ForumThreadResponse> getMyThreads(String username) {
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        List<ForumThread> threads = forumThreadRepository.findByAuthor(user);
        return threads.stream().map(this::toForumThreadResponse).toList();
    }

    // full replace of the editable fields; no status reset since the forum has no moderation
    public ForumThreadResponse updateThread(Long id, ForumThreadRequest request, String username) {
        ForumThread thread = forumThreadRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Thread not found"));
        // only the author may edit
        if(!thread.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("You are not the author of this thread");
        }
        thread.setTitle(request.getTitle());
        thread.setContent(request.getContent());
        thread.setCity(request.getCity());
        thread.setUniversity(request.getUniversity());
        thread.setForumCategory(request.getForumCategory());
        ForumThread savedThread = forumThreadRepository.save(thread);

        return toForumThreadResponse(savedThread);
    }

    public void deleteThread(Long id, String username) {
        ForumThread thread = forumThreadRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Thread not found"));
        if(!thread.getAuthor().getUsername().equals(username)) {
            throw new ForbiddenException("You are not the author of this thread");
        }
        // hard delete: ForumReply.thread has ON DELETE CASCADE, so replies are cleaned up at the DB level
        forumThreadRepository.delete(thread);
    }


    // detail view: the thread plus its full reply tree.
    // In the DB each reply only points UP to its parent (parent_reply_id), but the client wants each reply to hold
    // its children (nested JSON). So we flip the direction in memory: flat list -> "parent id -> children" map -> tree
    public ForumThreadResponse getThreadById(Long id) {
        ForumThread thread = forumThreadRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Thread not found"));
        // replies stay null here; filled in at the end
        ForumThreadResponse forumThreadResponse = toForumThreadResponse(thread);
        // ForumThread has no replies field, so fetch them all in ONE query (flat list, oldest first)
        List<ForumReply> allReplies = forumReplyRepository.findByThreadOrderByCreatedAtAsc(thread);

        // "who are the children of reply X?" lookup: key = parent reply id, value = its direct children.
        // Root replies (parentReply == null) are skipped — they have no parent to be grouped under.
        // groupingBy keeps the original order, so children stay sorted by createdAt
        Map<Long,List<ForumReply>> byParentId = allReplies.stream()
                .filter(r -> r.getParentReply()!=null)
                .collect(Collectors.groupingBy(r -> r.getParentReply().getId()));

        // roots = replies directly to the thread; each one recursively builds its whole subtree
        List<ForumReplyResponse> rootReplies = allReplies.stream()
                .filter(r -> r.getParentReply()==null)
                .map(r -> buildReplyTree(r, byParentId))
                .toList();

        forumThreadResponse.setReplies(rootReplies);

        return  forumThreadResponse;


    }


    // adds a reply to a thread; parentReplyId == null -> top-level reply, otherwise nested under that reply
    public ForumReplyResponse createReply(Long threadId, ForumReplyRequest request, String username) {
        ForumThread thread = forumThreadRepository.findById(threadId).orElseThrow(() -> new ResourceNotFoundException("Thread not found"));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        // stays null for a top-level reply
        ForumReply parentReply = null;
        if(request.getParentReplyId()!=null) {
            parentReply = forumReplyRepository.findById(request.getParentReplyId()).orElseThrow(() -> new ResourceNotFoundException("Reply not found"));
            // prevent attaching a reply under a parent that belongs to a different thread
            if(!parentReply.getThread().getId().equals(thread.getId())) {
                throw new BadRequestException("This reply does not belong to this thread");
            }
        }

        ForumReply reply = ForumReply.builder()
                .author(user)
                .content(request.getContent())
                .thread(thread)
                .parentReply(parentReply)
                .deleted(false)
                .build();

        forumReplyRepository.save(reply);

        // a fresh reply has no children yet, so no tree building needed — replies stays null
        return  toForumReplyResponse(reply);
    }

    public void deleteReply(Long replyId, String username) {
        ForumReply reply = forumReplyRepository.findById(replyId).orElseThrow(()  -> new ResourceNotFoundException("Reply not found"));
        if(!reply.getAuthor().getUsername().equals(username)){
            throw new ForbiddenException("You are not the author of this reply");
        }

        // soft delete: keep the row so child replies in the tree still have a parent to attach to
        reply.setContent("deleted");
        reply.setDeleted(true);
        forumReplyRepository.save(reply);

    }

    // entity -> DTO; exposes only the author's username instead of the whole User (password hash, email...)
    private ForumThreadResponse toForumThreadResponse(ForumThread thread) {
        return ForumThreadResponse.builder()
                .id(thread.getId())
                .authorName(thread.getAuthor().getUsername())
                .title(thread.getTitle())
                .content(thread.getContent())
                .city(thread.getCity())
                .university(thread.getUniversity())
                .forumCategory(thread.getForumCategory())
                .createdAt(thread.getCreatedAt())
                .updatedAt(thread.getUpdatedAt())
                .build();
    }

    // maps a single reply WITHOUT its children; buildReplyTree adds them on top
    private ForumReplyResponse toForumReplyResponse(ForumReply thread) {
        return ForumReplyResponse.builder()
                .id(thread.getId())
                .authorName(thread.getAuthor().getUsername())
                .content(thread.getContent())
                .createdAt(thread.getCreatedAt())
                .updatedAt(thread.getUpdatedAt())
                .deleted(thread.isDeleted())
                .build();
    }

    // recursively turns one reply into a DTO that contains its whole subtree.
    // No explicit base case needed: a leaf has no entry in byParentId -> empty children list -> .map() makes no
    // further calls, so the recursion stops by itself
    private ForumReplyResponse buildReplyTree(ForumReply reply,  Map<Long, List<ForumReply>> byParentId) {
        // this reply on its own, replies still null
        ForumReplyResponse response = toForumReplyResponse(reply);

        // look up children by THIS reply's id (it's the parent here); List.of() instead of null for leaves
        List<ForumReply> children = byParentId.getOrDefault(reply.getId(),List.of());


        // recursion: each child builds its own subtree the same way
        List<ForumReplyResponse> childrenResponse = children.stream()
                .map(child -> buildReplyTree(child,byParentId))
                .toList();

        // leaves get an empty list [] rather than null — easier for the frontend to render
        response.setReplies(childrenResponse);

        return response;
    }




}
