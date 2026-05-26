package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.Guide;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuideRepository extends JpaRepository<Guide, Long> {
    List<Guide> findByAuthor(User author);
    Optional<Guide> findById(Long id);
}
