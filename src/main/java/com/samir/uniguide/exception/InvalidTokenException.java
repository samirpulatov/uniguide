package com.samir.uniguide.exception;

// maps to 401; bad/expired JWT or refresh token
public class InvalidTokenException extends RuntimeException{
    public InvalidTokenException(String message) {
        super(message);
    }
}
