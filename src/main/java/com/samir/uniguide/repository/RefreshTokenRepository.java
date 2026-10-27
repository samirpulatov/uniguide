package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.RefreshToken;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(User user);

    // @Transactional required here because a derived delete query needs an active transaction to execute
    @Transactional
    void deleteByUser(User user);
}
