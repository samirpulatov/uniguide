package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.ForumReply;
import com.samir.uniguide.model.entity.ForumThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ForumReplyRepository extends JpaRepository<ForumReply, Long> {
    // fetches a thread's full reply list in one query, to build the reply tree in memory instead of N+1 lookups
    List<ForumReply> findByThreadOrderByCreatedAtAsc(ForumThread thread);

}
