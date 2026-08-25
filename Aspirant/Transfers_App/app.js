// Default Initial Data (only used if localStorage is empty)
const defaultData = {
    months: [
        { id: 'aug-26', monthYear: 'August-2026', notices: 2 },
        { id: 'jun-26', monthYear: 'June-2026', notices: 5 },
    ],
    transfers: {
        'aug-26': [
            { id: 't1', date: '13/08/2026', title: '1857 की क्रांति - मुख्य कारण', detail: '1857 की क्रांति के मुख्य कारणों में राजनीतिक, आर्थिक, सामाजिक और धार्मिक कारण शामिल थे...' },
            { id: 't2', date: '17/08/2026', title: 'भारतीय राष्ट्रीय कांग्रेस की स्थापना', detail: 'भारतीय राष्ट्रीय कांग्रेस की स्थापना 28 दिसंबर 1885 को बॉम्बे में हुई थी...' }
        ],
        'jun-26': [
            { id: 't3', date: '09/06/2026', title: 'मौर्य साम्राज्य का पतन', detail: 'अशोक की मृत्यु के बाद मौर्य साम्राज्य का पतन शुरू हो गया था...' },
            { id: 't4', date: '17/06/2026', title: 'सिंधु घाटी सभ्यता', detail: 'सिंधु घाटी सभ्यता एक कांस्य युगीन सभ्यता थी...' }
        ]
    }
};

// State Data (Loaded from LocalStorage or Default)
let appData = { months: [], transfers: {} };

// DOM Elements
const monthsTbody = document.getElementById('months-tbody');
const transfersTbody = document.getElementById('transfers-tbody');
const transfersTitle = document.getElementById('transfers-title');
const modal = document.getElementById('transfer-modal');
const closeModalBtn = document.getElementById('close-modal');
const printBtn = document.getElementById('print-btn');
const modalSubtitle = document.getElementById('modal-subtitle');
const modalText = document.getElementById('modal-text');

// Form Modal Elements
const addModal = document.getElementById('add-modal');
const addNewBtn = document.getElementById('add-new-btn');
const closeAddModalBtn = document.getElementById('close-add-modal');
const addForm = document.getElementById('add-form');

let selectedMonthId = null;

// Initialize App
function init() {
    loadData();
    renderMonthsList();
    setupEventListeners();
}

// Load data from localStorage
function loadData() {
    const storedData = localStorage.getItem('upscAppData');
    if (storedData) {
        appData = JSON.parse(storedData);
    } else {
        appData = JSON.parse(JSON.stringify(defaultData)); // Deep copy default
        saveData();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('upscAppData', JSON.stringify(appData));
}

// Render the left pane list
function renderMonthsList() {
    monthsTbody.innerHTML = '';
    
    appData.months.forEach(month => {
        const tr = document.createElement('tr');
        tr.dataset.id = month.id;
        
        tr.innerHTML = `
            <td>${month.monthYear}</td>
            <td>${month.notices}</td>
            <td>
                <a href="#" class="action-icon view-month-btn" aria-label="View ${month.monthYear}">
                    <i class="ph ph-eye"></i>
                </a>
            </td>
        `;
        
        // Row click event
        tr.addEventListener('click', () => selectMonth(month.id, month.monthYear));
        
        monthsTbody.appendChild(tr);
    });
}

// Handle month selection
function selectMonth(id, title) {
    document.querySelectorAll('#months-tbody tr').forEach(row => {
        row.classList.remove('selected');
    });
    
    const selectedRow = document.querySelector(`#months-tbody tr[data-id="${id}"]`);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
    
    selectedMonthId = id;
    transfersTitle.textContent = `विषय: ${title}`;
    
    renderTransfersList(id);
}

// Render the right pane list based on selected month
function renderTransfersList(monthId) {
    transfersTbody.innerHTML = '';
    const transfers = appData.transfers[monthId] || [];
    
    if (transfers.length === 0) {
        transfersTbody.innerHTML = '<tr><td colspan="3" class="empty-state">इस महीने के लिए कोई जानकारी नहीं मिली।</td></tr>';
        return;
    }
    
    transfers.forEach(transfer => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${transfer.date}</td>
            <td>${transfer.title}</td>
            <td>
                <a href="#" class="action-icon view-transfer-btn" aria-label="View Details">
                    <i class="ph ph-eye"></i>
                </a>
            </td>
        `;
        
        const viewBtn = tr.querySelector('.view-transfer-btn');
        viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal(transfer);
        });
        
        transfersTbody.appendChild(tr);
    });
}

// Add New Entry Logic
addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    try {
        const dateInput = document.getElementById('entry-date').value; // Expected YYYY-MM-DD
        const titleInput = document.getElementById('entry-title').value;
        const detailsInput = document.getElementById('entry-details').value;
        
        if(!dateInput || !titleInput || !detailsInput) {
            alert('कृपया सभी फ़ील्ड भरें। (Please fill all fields.)');
            return;
        }
        
        // Robust Date Parsing
        let year, monthIndex, day;
        const parts = dateInput.split('-');
        if (parts.length === 3) {
            year = parts[0];
            monthIndex = parseInt(parts[1], 10) - 1;
            day = parts[2];
        } else {
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) {
                alert('कृपया सही दिनांक दर्ज करें (Please enter a valid date).');
                return;
            }
            year = d.getFullYear();
            monthIndex = d.getMonth();
            day = String(d.getDate()).padStart(2, '0');
        }

        const monthsName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const monthName = monthsName[monthIndex];
        
        if (!monthName) {
            alert('अमान्य दिनांक (Invalid Date).');
            return;
        }
        
        const displayDate = `${String(day).padStart(2, '0')}/${String(monthIndex + 1).padStart(2, '0')}/${year}`;
        const monthYear = `${monthName}-${year}`;
        const monthId = `${monthName.substring(0,3).toLowerCase()}-${String(year).substring(2,4)}`; // e.g. aug-26
        
        // Create new transfer object
        const newEntry = {
            id: 't' + Date.now(),
            date: displayDate,
            title: titleInput,
            detail: detailsInput
        };
        
        // Check if month exists
        let existingMonth = appData.months.find(m => m.id === monthId);
        
        if (existingMonth) {
            existingMonth.notices += 1;
        } else {
            // Add new month at the beginning
            appData.months.unshift({
                id: monthId,
                monthYear: monthYear,
                notices: 1
            });
        }
        
        // Add to transfers array
        if (!appData.transfers[monthId]) {
            appData.transfers[monthId] = [];
        }
        appData.transfers[monthId].unshift(newEntry); // Add to top
        
        saveData();
        renderMonthsList();
        selectMonth(monthId, monthYear); // Auto select the new/updated month
        
        // Reset and close
        addForm.reset();
        closeAddModal();
        
    } catch (error) {
        console.error(error);
        alert('डेटा सेव करते समय एक त्रुटि हुई: ' + error.message);
    }
});


// Details Modal Functions
function openModal(transfer) {
    modalSubtitle.textContent = `दिनांक: ${transfer.date}`;
    
    // Format text to handle line breaks properly
    const formattedText = transfer.detail.replace(/\n/g, '<br>');
    modalText.innerHTML = formattedText;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Add Form Modal Functions
function openAddModal() {
    addModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAddModal() {
    addModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Setup static event listeners
function setupEventListeners() {
    // Details Modal
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Add form Modal
    addNewBtn.addEventListener('click', openAddModal);
    closeAddModalBtn.addEventListener('click', closeAddModal);
    addModal.addEventListener('click', (e) => {
        if (e.target === addModal) closeAddModal();
    });
    
    // Global Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modal.classList.contains('hidden')) closeModal();
            if (!addModal.classList.contains('hidden')) closeAddModal();
        }
    });
    
    // Print functionality
    printBtn.addEventListener('click', () => {
        window.print();
    });
    
    // Select first month by default on load
    if (appData.months.length > 0) {
        selectMonth(appData.months[0].id, appData.months[0].monthYear);
    }
}

// Start app
document.addEventListener('DOMContentLoaded', init);
