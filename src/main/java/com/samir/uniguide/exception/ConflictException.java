package com.samir.uniguide.exception;

// maps to 409; email or username already taken
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
