package com.samir.uniguide.model.entity;


import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.JobType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A job vacancy posted by a user. The wage is always per hour ({@code salaryPerHour}),
 * so the "from X €/h" filter compares like with like; an unpaid internship is stored as 0.
 */
@Entity
@Table(name = "job_vacancy")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class JobVacancy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private City city;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobType jobType;

    // €/h, max 999.99; 0 = unpaid (e.g. Pflichtpraktikum)
    @Column(precision = 5, scale = 2, nullable = false)
    private BigDecimal salaryPerHour;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // LAZY: lists load authors explicitly with @EntityGraph (see JobVacancyRepository) to avoid N+1
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

}
