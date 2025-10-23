
# Task Planner

👉 **For all source code files (controllers, services, repositories, etc.), go to:**  
**[`task_planner/src/main/java/com/example`](https://github.com/SrikarGoli/Smart-task-planner/tree/main/task_planner/src/main/java/com/example)**


A Spring Boot web application that uses Google Gemini AI to break down project goals into structured, actionable tasks with priorities, timelines, and dependencies.

## Features

- AI-powered task generation using Google Gemini 2.0 Flash
- Structured task breakdown with headings, priorities, timelines, dependencies, and due dates
- Modern web interface with responsive design
- REST API for task generation
- Integrated frontend and backend in a single application

## Tech Stack

### Backend
- Spring Boot 3.5.6
- Java 17
- Google Gemini 2.0 Flash API
- OkHttp for HTTP client
- Jackson for JSON processing

### Frontend
- HTML5, CSS3, JavaScript
- Responsive design with modern UI

## Prerequisites

- Java 17 or higher
- Maven 3.6+ (Maven wrapper included)
- Google Gemini API key

## Setup

1. Clone the repository
2. Navigate to the project folder:
   ```bash
   cd task_planner
   ```
3. Get a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
4. Set the API key as an environment variable:
   ```bash
   export GEMINI_API_KEY=your_api_key_here
   ```
   Or on Windows:
   ```powershell
   $env:GEMINI_API_KEY = "your_api_key_here"
   ```

## Running the Application

```bash
cd task_planner
./mvnw spring-boot:run
```

The application will start on http://localhost:8080

## Usage

1. Open http://localhost:8080 in your browser
2. Enter your project goal in the text field
3. Click "Generate Plan"
4. View the structured task breakdown with priorities, timelines, and dependencies

## API

### Generate Tasks
**POST** `/api/tasks/generate`

Request body:
```json
{
  "goal": "Launch a mobile app in 3 months"
}
```

Response:
```json
[
  {
    "heading": "Define App Requirements",
    "priority": "HIGH",
    "timeline": "2-3 weeks",
    "dependencies": "None",
    "dueDate": "Week 3",
    "matter": "Gather requirements, define features, create user stories..."
  }
]
```

## Configuration

The application uses the following configuration properties:

```properties
# Server
server.port=8080

# Gemini API
gemini.api.key=${GEMINI_API_KEY:YOUR_API_KEY_HERE}
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

# CORS
spring.web.cors.allowed-origins=http://localhost:3000,http://127.0.0.1:3000
```

## Project Structure

```
src/
├── main/
│   ├── java/
│   │   └── com/example/
│   │       ├── controller/
│   │       │   └── TaskController.java
│   │       └── task_planner/
│   │           └── TaskPlannerApplication.java
│   └── resources/
│       ├── static/
│       │   ├── index.html
│       │   └── app.js
│       └── application.properties
└── test/
    └── java/
        └── com/example/task_planner/
            └── TaskPlannerApplicationTests.java
```

## License

This project is for educational and demonstration purposes.
