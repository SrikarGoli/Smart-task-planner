package com.example.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.MediaType;
import org.springframework.beans.factory.annotation.Value;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
public class TaskController {

    private final OkHttpClient httpClient = new OkHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    @Value("${gemini.api.url}")
    private String geminiApiUrl;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Controller is working!");
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateTasks(@org.springframework.web.bind.annotation.RequestBody Map<String, String> request) {
        try {
            String goal = request.get("goal");
            if (goal == null || goal.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Goal is required"));
            }

            // Call Gemini API directly from controller
            List<Map<String, Object>> tasks = generateTasksFromGemini(goal);

            return ResponseEntity.ok(tasks);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private List<Map<String, Object>> generateTasksFromGemini(String goal) {
        List<Map<String, Object>> tasks = new ArrayList<>();

        try {
            // Create the prompt for structured task generation
            String prompt = createTaskGenerationPrompt(goal);

            // Call Gemini API
            String response = callGeminiAPI(prompt);

            // Parse the response to extract structured data
            tasks = parseGeminiResponse(response);

            // If parsing failed, throw exception
            if (tasks.isEmpty()) {
                throw new RuntimeException("Failed to parse Gemini API response");
            }

        } catch (Exception e) {
            throw new RuntimeException("Error calling Gemini API: " + e.getMessage());
        }

        return tasks;
    }

    private String createTaskGenerationPrompt(String goal) {
        return "You are an expert project manager. Break down the following goal into 4-6 actionable tasks with realistic timelines.\\n\\n" +
               "GOAL: " + goal + "\\n\\n" +
               "For each task, provide:\\n" +
               "- **Heading**: A clear, concise task title\\n" +
               "- **Priority**: HIGH, MEDIUM, or LOW\\n" +
               "- **Timeline**: Estimated duration (e.g., '2-3 days', '1 week', '2 weeks')\\n" +
               "- **Dependencies**: What must be completed before this task (list task numbers or 'None')\\n" +
               "- **Due Date**: When this task should be completed (relative to project start, e.g., 'Day 3', 'Week 2', 'End of Month 1')\\n" +
               "- **Matter**: Detailed explanation of what needs to be done\\n\\n" +
               "Format your response exactly like this example:\\n\\n" +
               "**Heading:** Define Project Requirements\\n" +
               "**Priority:** HIGH\\n" +
               "**Timeline:** 3-5 days\\n" +
               "**Dependencies:** None\\n" +
               "**Due Date:** Day 5\\n" +
               "**Matter:** Conduct stakeholder interviews, analyze requirements, create detailed specifications and documentation\\n\\n" +
               "**Heading:** Design System Architecture\\n" +
               "**Priority:** HIGH\\n" +
               "**Timeline:** 1 week\\n" +
               "**Dependencies:** Task 1\\n" +
               "**Due Date:** Week 2\\n" +
               "**Matter:** Create technical design documents, define APIs, plan database schema and system components\\n\\n" +
               "Provide 4-6 tasks following this exact format with all markers (**Heading:**, **Priority:**, **Timeline:**, **Dependencies:**, **Due Date:**, **Matter:**).";
    }

    private String callGeminiAPI(String prompt) {
        try {
            // Create JSON request body properly
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> content = new HashMap<>();
            Map<String, Object> parts = new HashMap<>();
            parts.put("text", prompt);
            content.put("parts", List.of(parts));
            requestBody.put("contents", List.of(content));

            String jsonBody = objectMapper.writeValueAsString(requestBody);

            // Create OkHttp request
            MediaType JSON = MediaType.get("application/json; charset=utf-8");
            RequestBody body = RequestBody.create(jsonBody, JSON);

            Request request = new Request.Builder()
                .url(geminiApiUrl + "?key=" + geminiApiKey)
                .post(body)
                .addHeader("Content-Type", "application/json")
                .build();

            // Execute request
            try (Response response = httpClient.newCall(request).execute()) {
                if (response.isSuccessful() && response.body() != null) {
                    String responseBody = response.body().string();
                    JsonNode root = objectMapper.readTree(responseBody);
                    return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                } else {
                    throw new RuntimeException("Gemini API returned: " + response.code());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to call Gemini API: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> parseGeminiResponse(String response) {
        List<Map<String, Object>> tasks = new ArrayList<>();

        try {
            // Parse the structured response using regex
            Pattern taskPattern = Pattern.compile(
                "\\*\\*Heading:\\*\\* (.+?)\\s*\\*\\*Priority:\\*\\* (.+?)\\s*\\*\\*Timeline:\\*\\* (.+?)\\s*\\*\\*Dependencies:\\*\\* (.+?)\\s*\\*\\*Due Date:\\*\\* (.+?)\\s*\\*\\*Matter:\\*\\* (.+?)(?=\\*\\*Heading:\\*\\*|\\Z)",
                Pattern.DOTALL
            );

            Matcher matcher = taskPattern.matcher(response);

            int taskNumber = 1;
            while (matcher.find() && taskNumber <= 6) {
                String heading = matcher.group(1).trim();
                String priority = matcher.group(2).trim();
                String timeline = matcher.group(3).trim();
                String dependencies = matcher.group(4).trim();
                String dueDate = matcher.group(5).trim();
                String matter = matcher.group(6).trim();

                Map<String, Object> task = new HashMap<>();
                task.put("heading", heading);
                task.put("priority", priority.toUpperCase());
                task.put("timeline", timeline);
                task.put("dependencies", dependencies);
                task.put("dueDate", dueDate);
                task.put("matter", matter);

                tasks.add(task);
                taskNumber++;
            }

        } catch (Exception e) {
            System.err.println("Error parsing Gemini response: " + e.getMessage());
        }

        return tasks;
    }
}
