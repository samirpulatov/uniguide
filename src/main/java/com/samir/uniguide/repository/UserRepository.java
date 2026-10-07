package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;


public interface UserRepository extends JpaRepository<User, UUID> {
    // login accepts either; AuthService picks one of these based on whether the input contains "@"
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    // used for register/profile-update conflict checks before hitting the DB unique constraint
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

}
