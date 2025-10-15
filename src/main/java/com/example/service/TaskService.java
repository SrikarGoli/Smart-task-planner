package com.example.service;

import com.example.entity.Task;
import java.util.List;

public interface TaskService {
    List<Task> generateTasks(String goal);
    List<Task> getAllTasks();
    Task getTaskById(Long id);
    void deleteTask(Long id);
}
