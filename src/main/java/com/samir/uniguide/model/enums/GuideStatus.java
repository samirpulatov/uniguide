package com.samir.uniguide.model.enums;

// moderation state of a Guide
public enum GuideStatus {
    // newly created or just updated, awaiting admin review
    PENDING,
    // visible to all users via public GET /guides
    APPROVED,
    // hidden; reason stored in Guide.rejectionReason
    REJECTED
}
