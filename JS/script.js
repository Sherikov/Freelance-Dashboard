// --- 1. State Management ---
let appData = {
    currency: 'USD',
    income: 0,
    expenses: 0,
    taxRate: 0,
    hoursPerDay: 6,
    daysPerWeek: 5,
    hourlyRate: 0,
    projects: [] 
};

// --- 2. DOM Elements ---
const inputs = {
    currency: document.getElementById('currency-select'),
    income: document.getElementById('income'),
    expenses: document.getElementById('expenses'),
    taxRate: document.getElementById('tax-rate'),
    hoursDay: document.getElementById('hours-day'),
    daysWeek: document.getElementById('days-week')
};

const display = {
    rate: document.getElementById('hourly-rate'),
    taxInfo: document.getElementById('tax-info'),
    pending: document.getElementById('total-pending'),
    paid: document.getElementById('total-paid'),
    list: document.getElementById('projects-list')
};

const projectForm = {
    name: document.getElementById('project-name'),
    hours: document.getElementById('project-hours'),
    btn: document.getElementById('add-project-btn')
};

// --- 3. Initialization ---
function init() {
    const savedData = localStorage.getItem('freelanceDashboardPro');
    if (savedData) {
        appData = JSON.parse(savedData);
    }
    
    // Populate Inputs
    inputs.currency.value = appData.currency || 'USD';
    inputs.income.value = appData.income || '';
    inputs.expenses.value = appData.expenses || '';
    inputs.taxRate.value = appData.taxRate || '';
    inputs.hoursDay.value = appData.hoursPerDay;
    inputs.daysWeek.value = appData.daysPerWeek;

    calculateRate();
    renderProjects();
}

// --- 4. Core Logic: Rate Calculation (With Tax) ---
function calculateRate() {
    const income = parseFloat(inputs.income.value) || 0;
    const expenses = parseFloat(inputs.expenses.value) || 0;
    const tax = parseFloat(inputs.taxRate.value) || 0;
    const hours = parseFloat(inputs.hoursDay.value) || 0;
    const days = parseFloat(inputs.daysWeek.value) || 0;
    const currency = inputs.currency.value;

    // Save to State
    appData.income = income;
    appData.expenses = expenses;
    appData.taxRate = tax;
    appData.hoursPerDay = hours;
    appData.daysPerWeek = days;
    appData.currency = currency;

    // 1. Calculate Net Need
    const netMonthlyNeed = income + expenses;

    // 2. Calculate Gross Need (Reverse Tax Calculation)
    // Formula: Net / (1 - (Tax / 100))
    // Example: Need 1000, Tax 20%. Gross = 1000 / 0.8 = 1250.
    let grossMonthlyNeed = netMonthlyNeed;
    if (tax > 0 && tax < 100) {
        grossMonthlyNeed = netMonthlyNeed / (1 - (tax / 100));
    }

    // 3. Calculate Hours available
    const totalHoursPerMonth = hours * days * 4;

    // 4. Calculate Rate
    if (totalHoursPerMonth > 0) {
        appData.hourlyRate = grossMonthlyNeed / totalHoursPerMonth;
    } else {
        appData.hourlyRate = 0;
    }

    // Update UI
    display.rate.innerText = formatCurrency(appData.hourlyRate) + '/h';
    display.taxInfo.innerText = `Includes ${tax}% tax buffer`;

    // Recalculate existing projects with new rate/currency
    recalculateProjects();
    saveData();
}

// --- 5. Project Logic ---
function addProject() {
    const name = projectForm.name.value;
    const hours = parseFloat(projectForm.hours.value);

    if (!name || isNaN(hours)) return alert('Fill in all fields');

    const newProject = {
        id: Date.now(),
        name: name,
        hours: hours,
        price: hours * appData.hourlyRate,
        status: 'pending' // 'pending' or 'paid'
    };

    appData.projects.push(newProject);
    projectForm.name.value = '';
    projectForm.hours.value = '';

    renderProjects();
    saveData();
}

function deleteProject(id) {
    appData.projects = appData.projects.filter(p => p.id !== id);
    renderProjects();
    saveData();
}

function toggleStatus(id) {
    const project = appData.projects.find(p => p.id === id);
    if (project) {
        project.status = project.status === 'pending' ? 'paid' : 'pending';
        renderProjects();
        saveData();
    }
}

function recalculateProjects() {
    // Updates prices based on new hourly rate
    appData.projects = appData.projects.map(p => ({
        ...p,
        price: p.hours * appData.hourlyRate
    }));
    renderProjects();
}

// --- 6. Render ---
function renderProjects() {
    display.list.innerHTML = '';
    
    let pendingTotal = 0;
    let paidTotal = 0;

    appData.projects.forEach(p => {
        // Calculate totals
        if (p.status === 'paid') paidTotal += p.price;
        else pendingTotal += p.price;

        const isPaid = p.status === 'paid';
        
        const item = document.createElement('div');
        item.className = `project-item ${isPaid ? 'paid' : ''}`;
        
        item.innerHTML = `
            <div class="project-left">
                <input type="checkbox" class="status-check" 
                    ${isPaid ? 'checked' : ''} 
                    onchange="toggleStatus(${p.id})">
                <div class="project-info">
                    <h3>${p.name}</h3>
                    <p>${p.hours} hrs @ ${formatCurrency(appData.hourlyRate)}/h</p>
                </div>
            </div>
            <div class="project-right">
                <div class="price-tag">${formatCurrency(p.price)}</div>
                <button class="delete-btn" onclick="deleteProject(${p.id})">&times;</button>
            </div>
        `;
        display.list.appendChild(item);
    });

    display.pending.innerText = formatCurrency(pendingTotal);
    display.paid.innerText = formatCurrency(paidTotal);
}

// --- 7. Utilities ---
function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: appData.currency
    }).format(num);
}

function saveData() {
    localStorage.setItem('freelanceDashboardPro', JSON.stringify(appData));
}

// --- 8. Event Listeners ---
Object.values(inputs).forEach(input => {
    input.addEventListener('input', calculateRate);
});
projectForm.btn.addEventListener('click', addProject);

// Start
init();