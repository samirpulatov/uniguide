package com.samir.uniguide.model.entity;

import com.samir.uniguide.model.enums.City;
import com.samir.uniguide.model.enums.ForumCategory;
import com.samir.uniguide.model.enums.University;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
// a forum discussion thread; hard-deleted (cascades to its replies), unlike Guide which is only ever soft-moderated
@Entity
@Table(name = "forum_threads")
public class ForumThread {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false,columnDefinition = "TEXT")
    private String content;

    // city, university and forumCategory are all optional; empty category and city together mean a global announcement
    @Enumerated(EnumType.STRING)
    private City city;

    @Enumerated(EnumType.STRING)
    private University university;

    @Enumerated(EnumType.STRING)
    private ForumCategory forumCategory;


    @Column(nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
