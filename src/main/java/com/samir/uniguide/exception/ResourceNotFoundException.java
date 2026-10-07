package com.samir.uniguide.exception;

// maps to 404; entity not found in DB
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
