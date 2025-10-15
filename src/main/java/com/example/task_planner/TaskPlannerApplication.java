package com.example.task_planner;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.example.task_planner", "com.example.controller"})
public class TaskPlannerApplication {

	public static void main(String[] args) {
		SpringApplication.run(TaskPlannerApplication.class, args);
	}

}
