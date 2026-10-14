package com.samir.uniguide.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Metadata of one photo of a housing listing. The image itself is stored by {@code StorageService};
 * this row only points to it through {@link #storageKey}.
 * Unidirectional: {@link Housing} does not have a list of its photos.
 */
@Entity
@Table(name = "housing_photo")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class HousingPhoto {
    // UUID instead of a counter: photo ids appear in public URLs and must not be guessable
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    // saved at upload time, so the file can be served with the right Content-Type header later
    @Column(nullable = false)
    private String contentType;

    // relative key like "housing/<uuid>.jpg", never an absolute path or URL; never sent to clients
    @Column(nullable = false, unique = true)
    private String storageKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "housing_id", nullable = false)
    private Housing housing;


}
