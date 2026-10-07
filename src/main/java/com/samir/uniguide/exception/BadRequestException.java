package com.samir.uniguide.exception;

// maps to 400; invalid request logic (e.g. REJECTED review without rejectionReason)
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
