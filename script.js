// Load habits from localStorage or empty array
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let chartInstance = null;

// Initialize
renderHabits();
initChart();

function addHabit() {
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
        current: 0,
        streak: 0,
        lastUpdated: new Date().toDateString(),
        history: [0, 0, 0, 0, 0, 0, 0] // Last 7 days
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
    
    // Check if new day for streak calculation
    const today = new Date().toDateString();
    if (habit.lastUpdated !== today) {
        if (change > 0 && habit.current >= habit.target) {
            habit.streak++;
        } else if (change < 0 && habit.current < habit.target) {
            habit.streak = 0;
        }
        habit.lastUpdated = today;
    }
    
    habit.current += change;
    if (habit.current < 0) habit.current = 0;
    
    // Update today's history
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
                <p>Add your first habit above to start tracking!</p>
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
        
        return `
            <div class="habit-card">
                <button class="delete-btn" onclick="deleteHabit(${habit.id})">×</button>
                <h3>${habit.name} ${habit.streak > 0 ? `<span class="streak">🔥 ${habit.streak}</span>` : ''}</h3>
                <p class="habit-meta">Goal: ${habit.target} ${typeLabel}</p>
                
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percentage}%"></div>
                </div>
                
                <div class="habit-controls">
                    <span class="habit-count">${habit.current}/${habit.target}</span>
                    <div class="habit-buttons">
                        <button class="btn-small btn-sub" onclick="updateHabit(${habit.id}, -1)">-</button>
                        <button class="btn-small btn-add" onclick="updateHabit(${habit.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function initChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
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
            }
        }
    });
}

function getChartDatasets() {
    // Calculate total completion rate per day across all habits
    const totals = [0, 0, 0, 0, 0, 0, 0];
    
    habits.forEach(habit => {
        habit.history.forEach((val, idx) => {
            totals[idx] += val;
        });
    });
    
    return [{
        label: 'Total Habits Completed',
        data: totals,
        borderColor: '#667eea',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4,
        fill: true
    }];
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

// Allow Enter key to add habit
document.getElementById('habit-name').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addHabit();
    }
});
