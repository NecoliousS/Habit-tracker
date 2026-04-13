// 6 fixed colors
const habitColors = [
    '#667eea', // Purple
    '#4caf50', // Green
    '#ff9800', // Orange
    '#e91e63', // Pink
    '#2196f3', // Blue
    '#f44336'  // Red
];

let habits = JSON.parse(localStorage.getItem('habits')) || [];
let chartInstance = null;

// Initialize - assign colors to old habits that don't have them
function migrateOldHabits() {
    let needsUpdate = false;
    habits.forEach((habit, index) => {
        if (!habit.color) {
            habit.color = habitColors[index % habitColors.length];
            needsUpdate = true;
        }
    });
    if (needsUpdate) {
        saveHabits();
    }
}

// Run migration on load
migrateOldHabits();
renderHabits();
initChart();

function getAvailableColor() {
    // Get colors already in use
    const usedColors = habits.map(h => h.color);
    // Find first unused color
    for (let color of habitColors) {
        if (!usedColors.includes(color)) {
            return color;
        }
    }
    // Fallback (shouldn't happen with 6 max)
    return habitColors[habits.length % habitColors.length];
}

function addHabit() {
    // STRICT CHECK: Block if 6 or more habits
    if (habits.length >= 6) {
        alert('Maximum 6 habits allowed. Delete one to add another.');
        return;
    }
    
    const nameInput = document.getElementById('habit-name');
    const typeSelect = document.getElementById('habit-goal-type');
    const targetInput = document.getElementById('habit-target');
    
    const name = nameInput.value.trim();
    const type = typeSelect.value;
    const target = parseInt(targetInput.value);
    
    if (!name || !target || target < 1) {
        alert('Please fill in all fields');
        return;
    }
    
    const habit = {
        id: Date.now(),
        name: name,
        type: type,
        target: target,
        color: getAvailableColor(), // Get unused color
        current: 0,
        streak: 0,
        lastUpdated: new Date().toDateString(),
        history: [0, 0, 0, 0, 0, 0, 0]
    };
    
    habits.push(habit);
    saveHabits();
    renderHabits();
    updateChart();
    
    // Clear inputs
    nameInput.value = '';
    targetInput.value = '';
}

function updateHabit(id, change) {
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    
    const today = new Date().toDateString();
    if (habit.lastUpdated !== today) {
        if (change > 0 && habit.current >= habit.target) {
            habit.streak++;
        } else if (change < 0 && habit.current < habit.target) {
            habit.streak = Math.max(0, habit.streak - 1);
        }
        habit.lastUpdated = today;
    }
    
    habit.current += change;
    if (habit.current < 0) habit.current = 0;
    
    habit.history[6] = habit.current;
    
    saveHabits();
    renderHabits();
    updateChart();
}

function deleteHabit(id) {
    if (confirm('Delete this habit?')) {
        habits = habits.filter(h => h.id !== id);
        saveHabits();
        renderHabits();
        updateChart();
    }
}

function renderHabits() {
    const container = document.getElementById('habits-container');
    
    if (habits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h2>No habits yet</h2>
                <p>Add up to 6 habits to start tracking!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = habits.map(habit => {
        const percentage = Math.min((habit.current / habit.target) * 100, 100);
        const typeLabel = {
            'daily': 'per day',
            'weekly': 'per week',
            'total': 'total'
        }[habit.type];
        
        // Use habit.color or default to blue if somehow missing
        const color = habit.color || '#667eea';
        
        return `
            <div class="habit-card" style="border-left: 4px solid ${color}">
                <button class="delete-btn" onclick="deleteHabit(${habit.id})">×</button>
                <h3 style="color: ${color}">${habit.name} ${habit.streak > 0 ? `<span class="streak" style="background: ${color}">🔥 ${habit.streak}</span>` : ''}</h3>
                <p class="habit-meta">Goal: ${habit.target} ${typeLabel}</p>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%; background: ${color}"></div>
                </div>
                
                <div class="habit-controls">
                    <span class="habit-count" style="color: ${color}">${habit.current}/${habit.target}</span>
                    <div class="habit-buttons">
                        <button class="btn-small btn-sub" onclick="updateHabit(${habit.id}, -1)">-</button>
                        <button class="btn-small btn-add" onclick="updateHabit(${habit.id}, 1)" style="background: ${color}">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: getChartDatasets()
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom'
                }
            }
        }
    });
}

function getChartDatasets() {
    return habits.map(habit => ({
        label: habit.name,
        data: habit.history,
        backgroundColor: habit.color || '#667eea',
        borderColor: habit.color || '#667eea',
        borderWidth: 2,
        borderRadius: 4
    }));
}

function updateChart() {
    if (chartInstance) {
        chartInstance.data.datasets = getChartDatasets();
        chartInstance.update();
    }
}

function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function clearAllData() {
    if (confirm('Clear ALL habits? This cannot be undone.')) {
        habits = [];
        saveHabits();
        renderHabits();
        updateChart();
    }
}

document.getElementById('habit-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addHabit();
    }
});
