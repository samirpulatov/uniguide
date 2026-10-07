package com.samir.uniguide.repository;

import com.samir.uniguide.model.entity.TodoTask;
import com.samir.uniguide.model.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;



import java.util.List;


public interface TodoTaskRepository extends JpaRepository<TodoTask, Long> {

    List<TodoTask> findByAuthorOrderByCreatedAtAsc(User author);
}
