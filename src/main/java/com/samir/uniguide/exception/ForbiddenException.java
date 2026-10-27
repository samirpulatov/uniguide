package com.samir.uniguide.exception;

// maps to 403; authenticated but not the resource owner. Named to avoid clashing with
// Spring Security's own AccessDeniedException
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
