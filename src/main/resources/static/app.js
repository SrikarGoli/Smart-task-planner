document.getElementById('goalForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const goal = document.getElementById('goalInput').value;
  const tasksContainer = document.getElementById('tasks');
  const submitBtn = document.querySelector('.generate-btn');
  const goalInput = document.getElementById('goalInput');

  // Disable form during processing
  submitBtn.disabled = true;
  goalInput.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

  tasksContainer.innerHTML = `
    <div class="loading">
      <i class="fas fa-brain"></i>
      <span>AI is analyzing your goal and creating a comprehensive plan...</span>
    </div>
  `;

  try {
    const response = await fetch('/api/tasks/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: goal })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (Array.isArray(data)) {
      renderTasks(data);
    } else if (data.tasks && Array.isArray(data.tasks)) {
      renderTasks(data.tasks);
    } else if (data.error) {
      throw new Error(data.error);
    } else {
      tasksContainer.innerHTML = '<div class="no-tasks"><i class="fas fa-exclamation-triangle"></i><br>No tasks could be generated. Please try rephrasing your goal.</div>';
    }
  } catch (err) {
    console.error('Error:', err);
    tasksContainer.innerHTML = `<div class="error"><i class="fas fa-exclamation-circle"></i> Error generating plan: ${err.message}</div>`;
  } finally {
    // Re-enable form
    submitBtn.disabled = false;
    goalInput.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Plan';
  }
});

function renderTasks(tasks) {
  const tasksContainer = document.getElementById('tasks');

  if (!tasks || !tasks.length) {
    tasksContainer.innerHTML = '<div class="no-tasks"><i class="fas fa-clipboard-list"></i><br>No tasks generated. Try entering a more specific goal.</div>';
    return;
  }

  // Sort tasks by priority (High -> Medium -> Low) and then by timeline if available
  const sortedTasks = tasks.sort((a, b) => {
    const priorityOrder = { 'HIGH': 3, 'CRITICAL': 3, 'URGENT': 3, 'MEDIUM': 2, 'NORMAL': 2, 'LOW': 1, 'MINOR': 1 };
    const aPriority = priorityOrder[(a.priority || 'MEDIUM').toUpperCase()] || 2;
    const bPriority = priorityOrder[(b.priority || 'MEDIUM').toUpperCase()] || 2;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // If same priority, try to sort by timeline or due date
    return 0;
  });

  // Create a map of task headings to their indices for dependency linking
  const taskMap = {};
  sortedTasks.forEach((task, index) => {
    const heading = task.heading || task.title || `Task ${index + 1}`;
    taskMap[heading.toLowerCase()] = index + 1;
  });

  let html = `
    <div class="timeline-container">
      <div class="timeline-header">
        <h3><i class="fas fa-route"></i> Your Task Roadmap</h3>
        <p class="timeline-summary">${sortedTasks.length} tasks planned • ${sortedTasks.filter(t => (t.priority || '').toUpperCase().includes('HIGH')).length} high priority</p>
      </div>
      <div class="timeline">
  `;

  sortedTasks.forEach((task, index) => {
    const priorityClass = getPriorityClass(task.priority);
    const priorityIcon = getPriorityIcon(task.priority);
    const isLast = index === sortedTasks.length - 1;
    const taskNumber = index + 1;

    // Parse and display dependencies
    let dependencyDisplay = '';
    if (task.dependencies && task.dependencies.toLowerCase() !== 'none') {
      const deps = parseDependencies(task.dependencies, taskMap);
      if (deps.length > 0) {
        dependencyDisplay = `
          <div class="dependencies-section">
            <div class="dependencies-header">
              <i class="fas fa-link"></i>
              <span>Depends on:</span>
            </div>
            <div class="dependency-links">
              ${deps.map(dep => `<span class="dependency-link" data-task="${dep.number}">${dep.text}</span>`).join('')}
            </div>
          </div>
        `;
      }
    }

    html += `
      <div class="timeline-item ${priorityClass}" data-task-id="${taskNumber}">
        <div class="timeline-marker">
          <div class="timeline-dot ${priorityClass}"></div>
          ${!isLast ? '<div class="timeline-line"></div>' : ''}
        </div>
        <div class="timeline-content">
          <div class="timeline-card">
            <div class="timeline-card-header">
              <div class="task-number">${taskNumber}</div>
              <div class="task-priority">
                <i class="${priorityIcon}"></i>
                <span>${task.priority || 'Medium'}</span>
              </div>
            </div>
            <h4 class="timeline-title">${task.heading || task.title || 'Untitled Task'}</h4>
            <div class="timeline-meta">
              ${task.timeline ? `<div class="meta-item timeline"><i class="fas fa-clock"></i> ${task.timeline}</div>` : ''}
              ${task.dueDate ? `<div class="meta-item due-date"><i class="fas fa-calendar-alt"></i> ${task.dueDate}</div>` : ''}
            </div>
            ${dependencyDisplay}
            <div class="timeline-description">
              ${task.matter || task.description || task.content || 'No description available.'}
            </div>
            <div class="timeline-actions">
              <button class="action-btn complete-btn" onclick="markTaskComplete(this)">
                <i class="fas fa-check"></i> Mark Complete
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  tasksContainer.innerHTML = html;

  // Add click handlers for dependency links
  document.querySelectorAll('.dependency-link').forEach(link => {
    link.addEventListener('click', function() {
      const taskNumber = this.getAttribute('data-task');
      const targetTask = document.querySelector(`[data-task-id="${taskNumber}"]`);
      if (targetTask) {
        targetTask.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetTask.classList.add('highlight-dependency');
        setTimeout(() => {
          targetTask.classList.remove('highlight-dependency');
        }, 2000);
      }
    });
  });
}

function parseDependencies(dependencies, taskMap) {
  if (!dependencies || dependencies.toLowerCase() === 'none') return [];

  const deps = [];
  const depText = dependencies.toLowerCase();

  // Try to match task headings or numbers
  Object.keys(taskMap).forEach(heading => {
    if (depText.includes(heading) || depText.includes(`task ${taskMap[heading]}`)) {
      deps.push({
        number: taskMap[heading],
        text: `Task ${taskMap[heading]}`
      });
    }
  });

  // If no matches found, try to extract numbers
  const numberMatches = dependencies.match(/\d+/g);
  if (numberMatches && deps.length === 0) {
    numberMatches.forEach(num => {
      const numInt = parseInt(num);
      if (numInt > 0 && numInt <= Object.keys(taskMap).length) {
        deps.push({
          number: numInt,
          text: `Task ${numInt}`
        });
      }
    });
  }

  // If still no matches, show the original dependency text
  if (deps.length === 0 && dependencies.trim()) {
    deps.push({
      number: null,
      text: dependencies.trim()
    });
  }

  return deps;
}

// Add function to mark tasks as complete
function markTaskComplete(button) {
  const timelineItem = button.closest('.timeline-item');
  const timelineCard = button.closest('.timeline-card');

  timelineItem.classList.add('completed');
  timelineCard.classList.add('completed');

  button.innerHTML = '<i class="fas fa-check-double"></i> Completed';
  button.classList.add('completed');
  button.disabled = true;

  // Add completion animation
  setTimeout(() => {
    timelineCard.style.transform = 'scale(0.98)';
    setTimeout(() => {
      timelineCard.style.transform = 'scale(1)';
    }, 150);
  }, 100);
}

function getPriorityClass(priority) {
  if (!priority) return 'priority-medium';
  switch (priority.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
    case 'URGENT':
      return 'priority-high';
    case 'MEDIUM':
    case 'NORMAL':
      return 'priority-medium';
    case 'LOW':
    case 'MINOR':
      return 'priority-low';
    default:
      return 'priority-medium';
  }
}

function getPriorityIcon(priority) {
  if (!priority) return 'fas fa-exclamation-triangle';
  switch (priority.toUpperCase()) {
    case 'HIGH':
    case 'CRITICAL':
    case 'URGENT':
      return 'fas fa-exclamation-triangle';
    case 'MEDIUM':
    case 'NORMAL':
      return 'fas fa-exclamation-circle';
    case 'LOW':
    case 'MINOR':
      return 'fas fa-info-circle';
    default:
      return 'fas fa-exclamation-circle';
  }
}
