package com.samir.uniguide.model.entity;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.HouseType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A housing listing created by a user: a WG room, an apartment or a dorm room.
 * Money and area use {@code BigDecimal} / {@code NUMERIC(10,2)} to avoid rounding errors of double.
 */
@Entity
@Table(name = "housing")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Housing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HouseType houseType;

    @Column(nullable = false)
    private String title;

    // Kaltmiete: rent without heating and utilities
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal coldRent;

    // Warmmiete: what the tenant really pays per month; the price filter uses this field
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal warmRent;

    // in square meters
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal area;

    // optional, not every listing asks for a deposit (Kaution)
    @Column(precision = 10, scale = 2)
    private BigDecimal deposit;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private City city;

    @Column(nullable = false)
    private String postCode;

    @Column(nullable = false)
    private String street;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // LAZY: lists load authors explicitly with @EntityGraph (see HousingRepository) to avoid N+1
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id",nullable = false)
    private User author;
}
