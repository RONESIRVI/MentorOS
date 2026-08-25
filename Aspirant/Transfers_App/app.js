class DynamicDashboard {
    constructor(config) {
        this.csvUrl = config.csvUrl;
        this.elements = {
            categorySelect: document.getElementById(config.categorySelectId),
            categoriesTbody: document.getElementById(config.categoriesTbodyId),
            itemsThead: document.getElementById(config.itemsTheadId),
            itemsTbody: document.getElementById(config.itemsTbodyId),
            itemsTitle: document.getElementById(config.itemsTitleId)
        };
        this.appData = { categories: [], items: {}, rawHeaders: [], displayCols: [] };
        this.selectedCategoryId = null;

        this.init();
    }

    init() {
        this.loadCSVData();
        this.setupEventListeners();
    }

    loadCSVData() {
        const self = this;
        Papa.parse(this.csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                self.processParsedData(results);
            },
            error: function(error) {
                console.error('Error fetching CSV:', error);
                self.elements.itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state" style="color:red;">डेटा लोड करने में त्रुटि हुई (Error loading data).</td></tr>';
            }
        });
    }

    processParsedData(parsed) {
        if (!parsed.data || parsed.data.length === 0) {
            this.elements.itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">कोई डेटा नहीं मिला (No data found).</td></tr>';
            return;
        }

        this.appData.rawHeaders = Object.keys(parsed.data[0]);

        let groupCol = this.appData.rawHeaders.find(h => h.toLowerCase() === 'examcategory') 
                    || this.appData.rawHeaders.find(h => h.toLowerCase() === 'templatetype')
                    || this.appData.rawHeaders.find(h => h.toLowerCase() === 'category')
                    || this.appData.rawHeaders.find(h => h.toLowerCase().includes('date'))
                    || this.appData.rawHeaders[0];

        let pref1 = this.appData.rawHeaders.find(h => h.toLowerCase().includes('title') || h.toLowerCase().includes('test')) || this.appData.rawHeaders[0];
        let pref2 = this.appData.rawHeaders.find(h => h.toLowerCase() === 'date' || h.toLowerCase() === 'दिनांक') || this.appData.rawHeaders[1] || '';
        let pref3 = this.appData.rawHeaders.find(h => h.toLowerCase().includes('finaltotal') || h.toLowerCase().includes('score') || h.toLowerCase().includes('marks')) || this.appData.rawHeaders[2] || '';
        
        this.appData.displayCols = [pref1];
        if (pref2) this.appData.displayCols.push(pref2);
        if (pref3) this.appData.displayCols.push(pref3);

        this.appData.categories = [];
        this.appData.items = {};

        parsed.data.forEach((row, index) => {
            let groupVal = row[groupCol];
            if (!groupVal || groupVal.trim() === '') {
                groupVal = 'Other / Uncategorized';
            }
            
            let catId = groupVal.replace(/\s+/g, '-').toLowerCase();

            let existingCat = this.appData.categories.find(c => c.id === catId);
            if (existingCat) {
                existingCat.count += 1;
            } else {
                this.appData.categories.push({ id: catId, name: groupVal, count: 1 });
            }

            if (!this.appData.items[catId]) {
                this.appData.items[catId] = [];
            }
            
            this.appData.items[catId].push({
                _internalId: 'row_' + index,
                rowData: row 
            });
        });

        this.renderCategoriesList();
        this.renderDynamicHeaders();
        this.populateCategoryDropdown();
        
        if (this.appData.categories.length > 0) {
            this.selectCategory(this.appData.categories[0].id, this.appData.categories[0].name);
        } else {
            this.elements.itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">कोई डेटा नहीं मिला (No data found).</td></tr>';
        }
    }

    renderDynamicHeaders() {
        let theadHTML = '<tr>';
        this.appData.displayCols.forEach(header => {
            theadHTML += `<th>${header}</th>`;
        });
        theadHTML += '<th>देखें (VIEW)</th></tr>';
        this.elements.itemsThead.innerHTML = theadHTML;
    }

    populateCategoryDropdown() {
        if (!this.elements.categorySelect) return;
        this.elements.categorySelect.innerHTML = '<option value="">श्रेणी चुनें (Select Category)</option>';
        this.appData.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            this.elements.categorySelect.appendChild(option);
        });
    }

    renderCategoriesList() {
        this.elements.categoriesTbody.innerHTML = '';
        this.appData.categories.forEach(cat => {
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
            tr.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectCategory(cat.id, cat.name);
            });
            this.elements.categoriesTbody.appendChild(tr);
        });
    }

    selectCategory(id, title) {
        const rows = this.elements.categoriesTbody.querySelectorAll('tr');
        rows.forEach(row => row.classList.remove('selected'));
        
        const selectedRow = this.elements.categoriesTbody.querySelector(`tr[data-id="${id}"]`);
        if (selectedRow) selectedRow.classList.add('selected');
        
        this.selectedCategoryId = id;
        this.elements.itemsTitle.textContent = `विषय: ${title}`;
        
        if (this.elements.categorySelect) {
            this.elements.categorySelect.value = id;
        }
        
        this.renderItemsList(id);
    }

    renderItemsList(catId) {
        this.elements.itemsTbody.innerHTML = '';
        const items = this.appData.items[catId] || [];
        
        if (items.length === 0) {
            this.elements.itemsTbody.innerHTML = '<tr><td colspan="100%" class="empty-state">इस श्रेणी के लिए कोई जानकारी नहीं मिली।</td></tr>';
            return;
        }
        
        items.forEach(item => {
            const tr = document.createElement('tr');
            let trHTML = '';
            this.appData.displayCols.forEach(key => {
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
                window.openSharedModal(item.rowData, this.appData.rawHeaders);
            });
            
            this.elements.itemsTbody.appendChild(tr);
        });
    }

    setupEventListeners() {
        if (this.elements.categorySelect) {
            this.elements.categorySelect.addEventListener('change', (e) => {
                const selectedId = e.target.value;
                if (selectedId) {
                    const cat = this.appData.categories.find(c => c.id === selectedId);
                    if (cat) this.selectCategory(cat.id, cat.name);
                }
            });
        }
    }
}

// --- SHARED MODAL LOGIC ---
window.openSharedModal = function(rowData, rawHeaders) {
    const modal = document.getElementById('transfer-modal');
    const modalBodyContent = document.getElementById('modal-body-content');
    let modalHTML = '';
    
    let titleKey = rawHeaders.find(h => h.toLowerCase().includes('title')) || rawHeaders[0];
    
    modalHTML += `<h4 style="margin-bottom: 1.5rem; font-weight: 700; font-size: 1.2rem; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${titleKey}: ${rowData[titleKey]}</h4>`;
    modalHTML += '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">';
    
    rawHeaders.forEach(key => {
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
    
    modalHTML += '</div>'; 
    modalBodyContent.innerHTML = modalHTML;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; 
};

function closeSharedModal() {
    const modal = document.getElementById('transfer-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Setup shared modal listeners
    const modal = document.getElementById('transfer-modal');
    document.getElementById('close-modal').addEventListener('click', closeSharedModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeSharedModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeSharedModal();
    });
    document.getElementById('print-btn').addEventListener('click', () => window.print());

    // Dashboard 1 (General Test Series - gid 1003446063)
    new DynamicDashboard({
        csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQdEJ4jJnmD0cCEpBtVHtw0d1z8nEYQRdoze10qmVMj4ydNDJqc8_3v-BZj_1hn4aHbOyWh8l-6d6/pub?gid=1003446063&single=true&output=csv',
        categorySelectId: 'category-select-1',
        categoriesTbodyId: 'categories-tbody-1',
        itemsTheadId: 'items-thead-1',
        itemsTbodyId: 'items-tbody-1',
        itemsTitleId: 'items-title-1'
    });

    // Dashboard 2 (UPSC MAINS - gid 644171246)
    new DynamicDashboard({
        csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTyQdEJ4jJnmD0cCEpBtVHtw0d1z8nEYQRdoze10qmVMj4ydNDJqc8_3v-BZj_1hn4aHbOyWh8l-6d6/pub?gid=644171246&single=true&output=csv',
        categorySelectId: 'category-select-2',
        categoriesTbodyId: 'categories-tbody-2',
        itemsTheadId: 'items-thead-2',
        itemsTbodyId: 'items-tbody-2',
        itemsTitleId: 'items-title-2'
    });
});
