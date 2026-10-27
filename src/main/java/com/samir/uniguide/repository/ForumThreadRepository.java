package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.ForumThread;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ForumThreadRepository extends JpaRepository<ForumThread, Long>, JpaSpecificationExecutor<ForumThread> {
    // backs GET /forum/threads/me — all of the current user's threads, unlike Guide there's no status to filter by
    List<ForumThread> findByAuthor(User author);

}
