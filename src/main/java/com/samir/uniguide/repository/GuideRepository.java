package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.Guide;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface GuideRepository extends JpaRepository<Guide, Long>, JpaSpecificationExecutor<Guide> {
    // backs GET /guides/me — the current user's own guides, any status (unlike the public list, which is APPROVED only)
    List<Guide> findByAuthor(User author);
}
