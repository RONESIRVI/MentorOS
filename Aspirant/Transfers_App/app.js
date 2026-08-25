// Google Sheet Published CSV URL 
const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQdEJ4jJnmD0cCEpBtVHtw0d1z8nEYQRdoze10qmVMj4ydNDJqc8_3v-BZj_1hn4aHbOyWh8l-6d6/pub?gid=1003446063&single=true&output=csv'; 

// State Data
let appData = { categories: [], items: {}, rawHeaders: [], displayCols: [] };

// DOM Elements
const categoriesTbody = document.getElementById('months-tbody');
const itemsThead = document.getElementById('transfers-thead');
const itemsTbody = document.getElementById('transfers-tbody');
const itemsTitle = document.getElementById('transfers-title');
const modal = document.getElementById('transfer-modal');
const closeModalBtn = document.getElementById('close-modal');
const printBtn = document.getElementById('print-btn');
const modalBodyContent = document.getElementById('modal-body-content');

let selectedCategoryId = null;

// Initialize App
function init() {
    loadCSVData();
    setupEventListeners();
}

// Fetch and Parse CSV Data using PapaParse
function loadCSVData() {
    Papa.parse(CSV_URL, {
        download: true,
        header: true, 
        skipEmptyLines: true,
        complete: function(results) {
            processParsedData(results);
        },
        error: function(error) {
            console.error('Error fetching CSV:', error);
            itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state" style="color:red;">डेटा लोड करने में त्रुटि हुई (Error loading data).</td></tr>';
        }
    });
}

// Process the raw CSV objects into our categories/items structure
function processParsedData(parsed) {
    if (!parsed.data || parsed.data.length === 0) {
        itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">कोई डेटा नहीं मिला (No data found).</td></tr>';
        return;
    }

    appData.rawHeaders = Object.keys(parsed.data[0]);

    // Find grouping column: 'ExamCategory', 'TemplateType', 'Category', or fallback to 'Date' or first column
    let groupCol = appData.rawHeaders.find(h => h.toLowerCase() === 'examcategory') 
                || appData.rawHeaders.find(h => h.toLowerCase() === 'templatetype')
                || appData.rawHeaders.find(h => h.toLowerCase() === 'category')
                || appData.rawHeaders.find(h => h.toLowerCase().includes('date'))
                || appData.rawHeaders[0];

    // Determine columns for Right Pane (Table View)
    // Preference: TestTitle, Date, FinalTotal
    let pref1 = appData.rawHeaders.find(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('test')) || appData.rawHeaders[0];
    let pref2 = appData.rawHeaders.find(h => h.toLowerCase() === 'date' || h.toLowerCase() === 'दिनांक') || appData.rawHeaders[1] || '';
    let pref3 = appData.rawHeaders.find(h => h.toLowerCase().includes('finaltotal') || h.toLowerCase().includes('score') || h.toLowerCase().includes('marks')) || appData.rawHeaders[2] || '';
    
    appData.displayCols = [pref1];
    if (pref2) appData.displayCols.push(pref2);
    if (pref3) appData.displayCols.push(pref3);

    // Reset data
    appData.categories = [];
    appData.items = {};

    parsed.data.forEach((row, index) => {
        let groupVal = row[groupCol];
        if (!groupVal || groupVal.trim() === '') {
            groupVal = 'Other / Uncategorized';
        }
        
        let catId = groupVal.replace(/\s+/g, '-').toLowerCase();

        // Add to category list
        let existingCat = appData.categories.find(c => c.id === catId);
        if (existingCat) {
            existingCat.count += 1;
        } else {
            appData.categories.push({
                id: catId,
                name: groupVal,
                count: 1
            });
        }

        // Add to items array
        if (!appData.items[catId]) {
            appData.items[catId] = [];
        }
        
        appData.items[catId].push({
            _internalId: 'row_' + index,
            rowData: row 
        });
    });

    renderCategoriesList();
    renderDynamicHeaders();
    
    // Auto-select first category
    if (appData.categories.length > 0) {
        selectCategory(appData.categories[0].id, appData.categories[0].name);
    } else {
        itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">कोई डेटा नहीं मिला (No data found).</td></tr>';
    }
}

// Render dynamic table headers for the right pane
function renderDynamicHeaders() {
    let theadHTML = '<tr>';
    appData.displayCols.forEach(header => {
        theadHTML += `<th>${header}</th>`;
    });
    theadHTML += '<th>देखें (VIEW)</th></tr>';
    itemsThead.innerHTML = theadHTML;
}

// Render the left pane list
function renderCategoriesList() {
    categoriesTbody.innerHTML = '';
    
    appData.categories.forEach(cat => {
        const tr = document.createElement('tr');
        tr.dataset.id = cat.id;
        
        tr.innerHTML = `
            <td>${cat.name}</td>
            <td>${cat.count}</td>
            <td>
                <a href="#" class="action-icon view-month-btn" aria-label="View ${cat.name}">
                    <i class="ph ph-eye"></i>
                </a>
            </td>
        `;
        
        tr.addEventListener('click', () => selectCategory(cat.id, cat.name));
        categoriesTbody.appendChild(tr);
    });
}

// Handle category selection
function selectCategory(id, title) {
    document.querySelectorAll('#months-tbody tr').forEach(row => {
        row.classList.remove('selected');
    });
    
    const selectedRow = document.querySelector(`#months-tbody tr[data-id="${id}"]`);
    if (selectedRow) {
        selectedRow.classList.add('selected');
    }
    
    selectedCategoryId = id;
    itemsTitle.textContent = `विषय: ${title}`;
    
    renderItemsList(id);
}

// Render the right pane list based on selected category
function renderItemsList(catId) {
    itemsTbody.innerHTML = '';
    const items = appData.items[catId] || [];
    
    if (items.length === 0) {
        itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">इस श्रेणी के लिए कोई जानकारी नहीं मिली।</td></tr>';
        return;
    }
    
    items.forEach(item => {
        const tr = document.createElement('tr');
        
        let trHTML = '';
        appData.displayCols.forEach(key => {
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
        
        itemsTbody.appendChild(tr);
    });
}

// Dynamic Modal Generation (skips empty fields)
function openModal(rowData) {
    let modalHTML = '';
    
    // First field as Title (e.g. TestTitle or CandidateName)
    let titleKey = appData.rawHeaders.find(h => h.toLowerCase().includes('title')) || appData.rawHeaders[0];
    
    modalHTML += `<h4 style="margin-bottom: 1.5rem; font-weight: 700; font-size: 1.2rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${titleKey}: ${rowData[titleKey]}</h4>`;
    
    // Grid container for structured look
    modalHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
    
    appData.rawHeaders.forEach(key => {
        const value = rowData[key];
        if (!value || value.trim() === '' || key === titleKey) return; 
        
        let displayValue = value;
        if(value.startsWith('http')) {
            displayValue = `<a href="${value}" target="_blank" style="color: #3b82f6; word-break: break-all; font-weight:600;">Link <i class="ph ph-link"></i></a>`;
        } else {
            displayValue = value.replace(/\n/g, '<br>');
        }
        
        modalHTML += `
        <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin:0 0 4px 0; font-size:0.75rem; color: #64748b; text-transform:uppercase; font-weight:700;">${key}</p>
            <div style="font-size: 0.95rem; font-weight: 600; color: #334155;">
                ${displayValue}
            </div>
        </div>
        `;
    });
    
    modalHTML += '</div>'; // End Grid
    
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
    closeModalBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!modal.classList.contains('hidden')) closeModal();
        }
    });
    
    printBtn.addEventListener('click', () => {
        window.print();
    });
}

document.addEventListener('DOMContentLoaded', init);
