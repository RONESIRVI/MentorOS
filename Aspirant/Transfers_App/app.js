// Google Sheet Published CSV URL 
// (Replace this with the actual published CSV link from Google Sheets)
// e.g. 'https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv'
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQdEJ4jJnmD0cCEpBtVHtw0d1z8nEYQRdoze10qmVMj4ydNDJqc8_3v-BZj_1hn4aHbOyWh8l-6d6/pub?gid=1003446063&single=true&output=csv'; 

// State Data
let appData = { months: [], transfers: {}, rawHeaders: [] };

// DOM Elements
const monthsTbody = document.getElementById('months-tbody');
const transfersThead = document.getElementById('transfers-thead');
const transfersTbody = document.getElementById('transfers-tbody');
const transfersTitle = document.getElementById('transfers-title');
const modal = document.getElementById('transfer-modal');
const closeModalBtn = document.getElementById('close-modal');
const printBtn = document.getElementById('print-btn');
const modalBodyContent = document.getElementById('modal-body-content');

let selectedMonthId = null;

// Initialize App
function init() {
    loadCSVData();
    setupEventListeners();
}

// Fetch and Parse CSV Data using PapaParse
function loadCSVData() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true, // Output as objects using first row as keys
        skipEmptyLines: true,
        complete: function(results) {
            processParsedData(results);
        },
        error: function(error) {
            console.error('Error fetching CSV:', error);
            transfersTbody.innerHTML = '<tr><td colspan="100%" class="empty-state" style="color:red;">डेटा लोड करने में त्रुटि हुई (Error loading data).</td></tr>';
        }
    });
}

// Process the raw CSV objects into our months/transfers structure
function processParsedData(parsed) {
    if (!parsed.data || parsed.data.length === 0) {
        transfersTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">कोई डेटा नहीं मिला (No data found).</td></tr>';
        return;
    }

    // Extract headers (keys of the first object)
    appData.rawHeaders = Object.keys(parsed.data[0]);

    // Try to find a Date column for grouping
    // It looks for a column exactly named 'Date' or 'दिनांक' or containing 'Date'
    let dateColumnName = appData.rawHeaders.find(h => h.toLowerCase().includes('date') || h.includes('दिनांक')) || appData.rawHeaders[0];

    // Reset data
    appData.months = [];
    appData.transfers = {};

    parsed.data.forEach((row, index) => {
        const dateStr = row[dateColumnName];
        let monthYearStr = 'Unknown';
        let monthId = 'unknown';

        if (dateStr) {
            // Attempt to parse date (assuming DD/MM/YYYY or YYYY-MM-DD or standard parseable string)
            // A simple logic for DD/MM/YYYY:
            let dObj = new Date(dateStr);
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    // Try to guess if it's DD/MM/YYYY
                    dObj = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
            }
            
            if (!isNaN(dObj.getTime())) {
                const monthsName = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                const monthName = monthsName[dObj.getMonth()];
                const year = dObj.getFullYear();
                monthYearStr = `${monthName}-${year}`;
                monthId = `${monthName.substring(0,3).toLowerCase()}-${String(year).substring(2,4)}`; 
            } else {
                monthYearStr = dateStr; // fallback to raw string if parsing fails
                monthId = dateStr.replace(/\\s+/g, '-').toLowerCase();
            }
        }

        // Add to month list
        let existingMonth = appData.months.find(m => m.id === monthId);
        if (existingMonth) {
            existingMonth.notices += 1;
        } else {
            appData.months.push({
                id: monthId,
                monthYear: monthYearStr,
                notices: 1
            });
        }

        // Add to transfers array
        if (!appData.transfers[monthId]) {
            appData.transfers[monthId] = [];
        }
        
        // Save the entire row object along with a unique ID
        appData.transfers[monthId].push({
            _internalId: 'row_' + index,
            rowData: row 
        });
    });

    // Sort months roughly (you can implement advanced sorting here)
    // Currently rendering as parsed.

    renderMonthsList();
    renderDynamicHeaders();
    
    // Auto-select first month
    if (appData.months.length > 0) {
        selectMonth(appData.months[0].id, appData.months[0].monthYear);
    } else {
        transfersTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">कोई डेटा नहीं मिला (No data found).</td></tr>';
    }
}

// Render dynamic table headers based on CSV columns
function renderDynamicHeaders() {
    let theadHTML = '<tr>';
    
    // We can choose to show only the first 2-3 columns in the table to save space, 
    // and show everything in the modal. Or show all columns. 
    // For this generic approach, we'll show up to 3 columns + 'VIEW' button
    const colsToShow = appData.rawHeaders.slice(0, 3); 
    
    colsToShow.forEach(header => {
        theadHTML += `<th>${header}</th>`;
    });
    
    theadHTML += '<th>देखें (VIEW)</th></tr>';
    transfersThead.innerHTML = theadHTML;
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

// Render the right pane list dynamically based on selected month
function renderTransfersList(monthId) {
    transfersTbody.innerHTML = '';
    const items = appData.transfers[monthId] || [];
    
    if (items.length === 0) {
        transfersTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">इस महीने के लिए कोई जानकारी नहीं मिली।</td></tr>';
        return;
    }
    
    const ObjectKeysToShow = appData.rawHeaders.slice(0, 3);
    
    items.forEach(item => {
        const tr = document.createElement('tr');
        
        let trHTML = '';
        ObjectKeysToShow.forEach(key => {
            trHTML += `<td>${item.rowData[key] || '-'}</td>`;
        });
        
        trHTML += `
            <td>
                <a href="#" class="action-icon view-transfer-btn" aria-label="View Details">
                    <i class="ph ph-eye"></i>
                </a>
            </td>
        `;
        
        tr.innerHTML = trHTML;
        
        const viewBtn = tr.querySelector('.view-transfer-btn');
        viewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openModal(item.rowData);
        });
        
        transfersTbody.appendChild(tr);
    });
}


// Dynamic Modal Generation
function openModal(rowData) {
    let modalHTML = '';
    
    appData.rawHeaders.forEach((key, index) => {
        const value = rowData[key];
        if (!value) return; // Skip empty fields
        
        // Treat the first item as a subtitle, the rest as blocks
        if (index === 0) {
            modalHTML += `<h4 style="margin-bottom: 1.5rem; font-weight: 500; font-size: 1rem;" class="text-muted">${key}: ${value}</h4>`;
        } else {
            // Check if value is a link
            let displayValue = value;
            if(value.startsWith('http')) {
                displayValue = `<a href="${value}" target="_blank" style="color: #3b82f6; word-break: break-all;">${value}</a>`;
            } else {
                displayValue = value.replace(/\\n/g, '<br>');
            }
            
            modalHTML += `
            <div style="margin-bottom: 1.25rem;">
                <p style="margin:0 0 4px 0; font-size:0.8rem; color: var(--text-muted); text-transform:uppercase; font-weight:600;">${key}</p>
                <div class="transfer-text" style="font-size: 1rem; padding: 1rem; margin-top: 5px;">
                    ${displayValue}
                </div>
            </div>
            `;
        }
    });
    
    modalBodyContent.innerHTML = modalHTML;
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
}

function closeModal() {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Setup static event listeners
function setupEventListeners() {
    // Details Modal
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Global Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modal.classList.contains('hidden')) closeModal();
        }
    });
    
    // Print functionality
    printBtn.addEventListener('click', () => {
        window.print();
    });
}

// Start app
document.addEventListener('DOMContentLoaded', init);
