package com.samir.uniguide.service;


import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.SecretKey;

import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for {@link JwtService}.
 * <p>
 * No Spring context is started: the service is created with {@code new},
 * so the {@code @Value} fields are not injected and must be set by hand.
 */
public class JwtServiceTest {
    private JwtService jwtService;

    /**
     * Creates a fresh service before each test, so a test that changes
     * {@code EXPIRATION_TIME} does not affect the other tests.
     */
    @BeforeEach
    void setUp() {
        jwtService = new JwtService();

        SecretKey testKey = Jwts.SIG.HS256.key().build();
        String encodedTestKey = Base64.getEncoder().encodeToString(testKey.getEncoded());


        // @Value does not work without Spring, so we write the private fields via reflection.
        // The secret must be valid Base64 and decode to at least 256 bits, otherwise jjwt rejects it for HMAC-SHA.
        // 1800000 ms = 30 minutes, long enough so the token does not expire during the test.
        ReflectionTestUtils.setField(jwtService, "SECRET", encodedTestKey);
        ReflectionTestUtils.setField(jwtService, "EXPIRATION_TIME", 1800000);
    }

    @Test
    @DisplayName("generate a token")
    void generateToken() {
        //Arrange
        String username = "testUser";

        //Act
        String token = jwtService.generateToken(username);

        //Assert
        assertNotNull(token);
        assertFalse(token.isBlank());
        // A signed JWT has three parts: header.payload.signature
        // (split takes a regex, so the dot must be escaped).
        assertEquals(3, token.split("\\.").length);
        // Round trip: the token we just created must be readable and valid for the same user.
        assertEquals(username,jwtService.getUsernameFromToken(token));
        assertTrue(jwtService.validateToken(token,username));
    }


    @Test
    @DisplayName("get username from token")
    void getUsernameFromToken() {
        //Arrange
        String username = "testUser";
        String token = jwtService.generateToken(username);

        //Act
        String actualUsername = jwtService.getUsernameFromToken(token);

        //Assert
        assertEquals(username,actualUsername);
    }

    @Test
    @DisplayName("validate token")
    void validateToken() {
        //Arrange
        String username = "testUser";
        String token = jwtService.generateToken(username);

        //Act
        boolean isValid = jwtService.validateToken(token,username);

        //Assert
        assertTrue(isValid);
    }

    @Test
    @DisplayName("validateToken throws  ExpiredJwtException for expired token")
    void validateToken_expiredToken_throwsExpiredJwtException() {
        //Arrange
        // A negative lifetime puts the expiration date 1 second in the past,
        // so the token is already expired when it is created. No need to wait.
        ReflectionTestUtils.setField(jwtService, "EXPIRATION_TIME", -1000L);
        String username = "testUser";
        String token = jwtService.generateToken(username);

        //Act && assert
        // jjwt checks the "exp" claim while parsing and throws before validateToken can return false.
        assertThrows(ExpiredJwtException.class, () -> jwtService.validateToken(token,username));

    }

    @Test
    @DisplayName("validateToken returns false for wrong username")
    void validateToken_wrongUsername_returnsFalse() {
        //Arrange
        String username = "testUser";
        String token = jwtService.generateToken(username);

        //Act
        // The token is valid and not expired, but it belongs to another user.
        boolean isValid = jwtService.validateToken(token,"testUser2");

        //Assert
        assertFalse(isValid);
        assertNotEquals("testUser2",jwtService.getUsernameFromToken(token));
    }




}
