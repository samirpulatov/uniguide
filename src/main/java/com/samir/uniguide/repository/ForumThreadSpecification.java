package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.ForumThread;
import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.ForumCategory;
import com.samir.uniguide.model.enums.University;
import org.springframework.data.jpa.domain.Specification;

// static predicates for GET /forum/threads?city=&category=&university=; null params are ignored (no condition added)
public class ForumThreadSpecification {
    public static Specification<ForumThread> hasCity(City city) {
        return (root,query, cb) -> city == null ? null : cb.equal(root.get("city"), city);
    }

    public static Specification<ForumThread> hasCategory(ForumCategory category) {
        return (root, query, cb) -> category == null ? null : cb.equal(root.get("forumCategory"), category);
    }

    public static Specification<ForumThread> hasUniversity(University university) {
        return (root, query, cb) -> university == null ? null : cb.equal(root.get("university"), university);
    }
}
