package com.samir.uniguide.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;


@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
// a reply in a forum thread; self-references parentReply to form a tree of nested replies. No moderation:
// forum content is visible immediately, unlike Guide
@Entity
@Table(name = "forum_replies")
public class ForumReply {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    // ON DELETE CASCADE at the DB level: deleting the thread removes all its replies, no manual cleanup needed
    @ManyToOne
    @JoinColumn(name = "thread_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private ForumThread thread;

    // null = top-level reply to the thread
    @ManyToOne
    @JoinColumn(name = "parent_reply_id", nullable = true)
    private ForumReply parentReply;


    @Column(nullable = false)
    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // soft-delete flag; content becomes tombstone text instead of the row being removed, so the tree stays intact
    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

}
