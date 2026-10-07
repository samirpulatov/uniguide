package com.samir.uniguide.model.entity;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.GuideCategory;
import com.samir.uniguide.model.enums.GuideStatus;
import com.samir.uniguide.model.enums.University;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Builder
@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
// a user-submitted guide (housing, visa, enrollment, etc.); goes through admin moderation before it's public
@Table(name = "guides")
public class Guide {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private GuideCategory guideCategory;

    // both optional: general guides (e.g. how to open a bank account) have neither
    @Enumerated(EnumType.STRING)
    private City city;

    @Enumerated(EnumType.STRING)
    private University university;

    @Column(nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;


    // PENDING on create and on every update, until an admin approves/rejects it again
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GuideStatus guideStatus = GuideStatus.PENDING;

    // only set when guideStatus is REJECTED
    private String rejectionReason;
}
