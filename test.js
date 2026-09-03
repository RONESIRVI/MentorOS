


    let currentPdfId = null;

    let currentPhotoIdForCategorization = null;

    function openPdfModal(title, driveLink, context = 'default', fileId = null) {
      currentPdfId = driveLink;
      currentPhotoIdForCategorization = fileId;
      document.getElementById('pdf-modal-title').textContent = title;
      const wrapper = document.getElementById('pdf-iframe-wrapper');
      
      const rankersView = document.getElementById('modal-rankers-view');
      const categorizeView = document.getElementById('modal-categorize-view');
      
      if (context === 'quote-bank') {
        rankersView.style.display = 'none';
        categorizeView.style.display = 'flex';
        
        // Render buttons
        const container = document.getElementById('categorize-buttons-container');
        const catsToUse = (window.SNIPPET_CATEGORIES && window.SNIPPET_CATEGORIES.categories) ? window.SNIPPET_CATEGORIES.categories : [];
        if(container && catsToUse.length > 0) {
            container.innerHTML = '';
            
            // Primary Types
            const primaryTypes = ['Theory Answers', 'Case Studies', 'Introductions', 'Conclusions'];
            const primaryContainer = document.createElement('div');
            primaryContainer.style = 'display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #e2e8f0; width: 100%;';
            
            primaryTypes.forEach(cat => {
              const btn = document.createElement('button');
              btn.className = 'btn-cat-assign';
              btn.setAttribute('data-cat', cat);
              let bg = '#eff6ff', color = '#2563eb', border = '#bfdbfe';
              if(cat === 'Theory Answers') { bg = '#eff6ff'; color = '#2563eb'; border = '#bfdbfe'; }
              if(cat === 'Case Studies') { bg = '#f0fdf4'; color = '#16a34a'; border = '#bbf7d0'; }
              if(cat === 'Introductions') { bg = '#fffbeb'; color = '#d97706'; border = '#fde68a'; }
              if(cat === 'Conclusions') { bg = '#faf5ff'; color = '#9333ea'; border = '#e9d5ff'; }
              btn.style = `padding:8px 14px; border-radius:20px; border:1px solid ${border}; background:${bg}; color:${color}; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; align-items:center; gap:6px;`;
              btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; };
              btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; };
              btn.innerHTML = `${cat}`;
              btn.onclick = () => savePhotoToQuoteBank(cat, btn);
              primaryContainer.appendChild(btn);
            });
            
            // Secondary Categories
            const secondaryContainer = document.createElement('div');
            secondaryContainer.style = 'display:flex; flex-wrap:wrap; gap:8px; width: 100%;';
            
            catsToUse.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'btn-cat-assign';
                btn.setAttribute('data-cat', cat);
                btn.innerHTML = `📄 ${cat}`;
                btn.style = 'padding:8px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#334155; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; align-items:center; gap:6px;';
                btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; btn.style.borderColor = '#94a3b8'; };
                btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; btn.style.borderColor = '#cbd5e1'; };
                btn.onclick = () => savePhotoToQuoteBank(cat, btn);
                secondaryContainer.appendChild(btn);
            });
            
            container.appendChild(primaryContainer);
            container.appendChild(secondaryContainer);
        }
        
        // Show as image using thumbnail API
        const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
        wrapper.innerHTML = `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000;"><img src="${thumbnailUrl}" style="max-width:100%; max-height:100%; object-fit:contain;"></div>`;
      } else {
        rankersView.style.display = 'block';
        categorizeView.style.display = 'none';
        
        // Convert standard drive link to preview link if needed
        let embedLink = driveLink;
        if(driveLink.includes('/view')) {
          embedLink = driveLink.replace('/view', '/preview');
        }
        
        wrapper.innerHTML = `<iframe src="${embedLink}" allow="autoplay" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"></iframe>`;
        if (typeof renderRankerSnippets === 'function') renderRankerSnippets();
      }
      
      document.getElementById('pdf-modal').style.display = 'flex';
    }

    async function savePhotoToQuoteBank(categoryName, btnEl) {
       if(!currentPhotoIdForCategorization) return;
       const originalText = btnEl.innerHTML;
       btnEl.innerHTML = 'Saving...';
       btnEl.disabled = true;
       
       const GAS_URL = "https://script.google.com/macros/s/AKfycbx0Gg-U9MLuqE352oz9gfIYiYzqvQd3cmS6ndZ7pGd-giGHshi6I_OI1XQ_EaZ1XhHS/exec";
       const targetRootId = "1TqXpQc1MPN5dgw41-X1rODhT3l71TeNB"; // Quote Bank Target Root ID
       
       try {
         const res = await fetch(`${GAS_URL}?action=categorize&fileId=${currentPhotoIdForCategorization}&categoryName=${encodeURIComponent(categoryName)}&targetRootId=${targetRootId}`);
         const data = await res.json();
         if(data.success) {
           try {
             let stored = localStorage.getItem('quoteBankFiles');
             let arr = stored ? JSON.parse(stored) : [];
             let fileIdx = arr.findIndex(f => f.id === currentPhotoIdForCategorization);
             if (fileIdx !== -1) {
               arr[fileIdx].category = categoryName;
             } else {
               if (window.selectedFileForCMS && window.selectedFileForCMS.id === currentPhotoIdForCategorization) {
                 window.selectedFileForCMS.category = categoryName;
                 arr.push(window.selectedFileForCMS);
               } else {
                 arr.push({ id: currentPhotoIdForCategorization, name: document.getElementById('pdf-modal-title').innerText, category: categoryName, link: `https://drive.google.com/file/d/${currentPhotoIdForCategorization}/preview` });
               }
             }
             localStorage.setItem('quoteBankFiles', JSON.stringify(arr));
             if (window.loadQuoteBankFiles) {
               // Update UI for the currently selected filter (or "all" if none selected)
               const activeFilter = document.querySelector('.btn-qb-filter[style*="background: rgb(59, 130, 246)"]');
               const catToLoad = activeFilter ? activeFilter.getAttribute('data-cat') : 'all';
               window.loadQuoteBankFiles(catToLoad);
             }
           } catch(e) { console.error("Error updating local storage:", e); }
           
           alert("✅ " + data.message);
           closePdfModal();
         } else {
           alert("❌ Error: " + data.error);
         }
       } catch (err) {
         alert("Network error: " + err.message);
       } finally {
         btnEl.innerHTML = originalText;
         btnEl.disabled = false;
       }
    }
    
    function closePdfModal() {
      document.getElementById('pdf-modal').style.display = 'none';
      document.getElementById('pdf-iframe-wrapper').innerHTML = '';
    }
  


    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, collection, getDocs, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { initSessionManager } from '../session-manager.js';

    const firebaseConfig = {
      apiKey: "AIzaSyB0T0bh7b7WpaGYyBk81MrqfRn2AUkXjfg",
      authDomain: "mains-rone-cse-e5268.firebaseapp.com",
      projectId: "mains-rone-cse-e5268",
      storageBucket: "mains-rone-cse-e5268.firebasestorage.app",
      messagingSenderId: "275537569597",
      appId: "1:275537569597:web:e8e4ad1dc25e7b9744c754"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    
    let _currentUserEmail = null;
    let _currentUserName = null;
    
    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', options);

    // Global Functions (Attached to window)
    window.switchAspirantSection = function(sectionId) {
      document.querySelectorAll('.aspirant-section').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
      const sec = document.getElementById('section-' + sectionId);
      if(sec) sec.style.display = 'block';
      const nav = document.getElementById('nav-' + sectionId);
      if(nav) nav.classList.add('active');

      if(sectionId === 'courses') window.loadCoursesList();
      if(sectionId === 'answers') window.loadMyAnswers();
      if(sectionId === 'quotebank') window.loadQuoteBankFiles('all');
      if(sectionId === 'rankers') window.loadRankersFolder('ROOT', "RONE Ranker's Root");
    };

    // --- QUOTE BANK LOGIC ---
    let currentQuoteBankCategory = 'all';

    window.loadQuoteBankFiles = function(category = 'all') {
      currentQuoteBankCategory = category;
      // Update sidebar active state
      document.querySelectorAll('.qb-category-list li').forEach(li => {
        if(li.getAttribute('data-cat') === category) li.classList.add('active');
        else li.classList.remove('active');
      });

      const container = document.getElementById('qb-cards-container');
      if(!container) return;

      const stored = localStorage.getItem('quoteBankFiles');
      const allFiles = stored ? JSON.parse(stored) : [];
      
      const filtered = category === 'all' ? allFiles : allFiles.filter(f => {
        if (!f.category) return false;
        const cleanCat1 = f.category.replace(/[\u1000-\uFFFF]/g, '').trim();
        const cleanCat2 = category.replace(/[\u1000-\uFFFF]/g, '').trim();
        return f.category === category || cleanCat1 === cleanCat2;
      });
      
      container.innerHTML = '';
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
      container.style.gap = '15px';
      
      if(filtered.length === 0) {
        container.style.display = 'block';
        container.innerHTML = `<p style="color:#64748b; font-size:0.95rem; grid-column: 1 / -1;">No materials found for this category. Admin needs to sync files from Google Drive.</p>`;
        return;
      }

      filtered.forEach(f => {
        const item = document.createElement('div');
        
        item.style = `
          position: relative;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 12px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        `;
        
        item.onmouseover = () => { 
            item.style.transform = 'translateY(-4px)'; 
            item.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; 
            item.style.borderColor = '#cbd5e1';
        };
        
        item.onmouseout = () => { 
            item.style.transform = 'translateY(0)'; 
            item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; 
            item.style.borderColor = '#e2e8f0';
        };

        const isImage = f.name.toLowerCase().endsWith('.png') || f.name.toLowerCase().endsWith('.jpg') || f.name.toLowerCase().endsWith('.jpeg');
        const iconDiv = document.createElement('div');
        iconDiv.style = `
          font-size: 3rem;
          line-height: 1;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        `;
        
        if (isImage) {
          iconDiv.innerHTML = `<img src="https://drive.google.com/thumbnail?id=${f.id}&sz=w400" style="width:100%; height:80px; object-fit:cover; border-radius:8px;">`;
          iconDiv.style.width = '100%';
          iconDiv.style.fontSize = 'initial';
        } else {
          iconDiv.innerHTML = '📄';
        }

        const nameDiv = document.createElement('div');
        nameDiv.style = `
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
          width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        `;
        nameDiv.title = f.name;
        nameDiv.textContent = f.name;
        
        item.appendChild(iconDiv);
        item.appendChild(nameDiv);

        const openBtn = document.createElement('button');
        openBtn.innerHTML = '👁️';
        openBtn.title = 'Open Preview';
        openBtn.style = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255,255,255,0.9);
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        `;
        openBtn.onmouseover = (e) => { e.stopPropagation(); openBtn.style.background = '#f1f5f9'; openBtn.style.transform = 'scale(1.1)'; };
        openBtn.onmouseout = (e) => { e.stopPropagation(); openBtn.style.background = 'rgba(255,255,255,0.9)'; openBtn.style.transform = 'scale(1)'; };
        
        openBtn.onclick = (e) => {
          e.stopPropagation();
          const embedLink = f.link && f.link !== 'undefined' ? f.link : `https://drive.google.com/file/d/${f.id}/preview`;
          window.openPdfModal(f.name, embedLink, 'quote-bank', f.id);
        };
        
        item.appendChild(openBtn);
        item.onclick = openBtn.onclick;

        container.appendChild(item);
      });
    };

    window.fullSyncQuoteBank = async function(btn) {
      if(!confirm("This will fetch all Quote Bank files from Google Drive and may take a minute. Continue?")) return;
      const GAS_URL = "https://script.google.com/macros/s/AKfycbx0Gg-U9MLuqE352oz9gfIYiYzqvQd3cmS6ndZ7pGd-giGHshi6I_OI1XQ_EaZ1XhHS/exec";
      const originalText = btn.textContent;
      btn.textContent = "⏳ Syncing...";
      btn.disabled = true;
      
      try {
        // 1. Get all category folders
        const rootRes = await fetch(`${GAS_URL}?folderId=1TqXpQc1MPN5dgw41-X1rODhT3l71TeNB`);
        const rootData = await rootRes.json();
        const rootItems = Array.isArray(rootData) ? rootData : (rootData.data || []);
        const folders = rootItems.filter(f => f.type === 'folder');
        
        let allQuoteFiles = [];
        
        // 2. Fetch files for each category folder
        for(const folder of folders) {
          try {
             const folderRes = await fetch(`${GAS_URL}?folderId=${folder.id}`);
             const folderData = await folderRes.json();
             const items = Array.isArray(folderData) ? folderData : (folderData.data || []);
             const files = items.filter(f => f.type !== 'folder');
             
             // Strip emojis from folder name to get base category name
             let catName = folder.name;
             
             files.forEach(f => {
               allQuoteFiles.push({
                 id: f.id,
                 name: f.name,
                 category: catName,
                 link: `https://drive.google.com/file/d/${f.id}/preview`
               });
             });
          } catch(e) {
            console.error("Failed to fetch folder " + folder.name, e);
          }
        }
        
        // 3. Save to localStorage
        localStorage.setItem('quoteBankFiles', JSON.stringify(allQuoteFiles));
        alert(`✅ Successfully synced ${allQuoteFiles.length} files from Quote Bank Drive!`);
        window.loadQuoteBankFiles(currentQuoteBankCategory);
        
      } catch (err) {
        alert("❌ Sync failed: " + err.message);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    };

    // Attach click listeners to sidebar categories
    document.addEventListener('DOMContentLoaded', async () => {
      // 1. Fetch dynamic categories from statically loaded snippet_categories.js
      let dynamicCats = [];
      try {
        if(window.SNIPPET_CATEGORIES) {
          dynamicCats = window.SNIPPET_CATEGORIES.categories || [];
        }
      } catch(err) {
        console.error("Could not load snippet_categories.js", err);
      }

      // 2. Populate Quote Bank Dynamic Filters
      const qbFiltersContainer = document.getElementById('qb-dynamic-filters');
      if (qbFiltersContainer && dynamicCats.length > 0) {
        qbFiltersContainer.innerHTML = '';
        
        // Primary Types (Theory, Case Studies, etc.)
        const primaryTypes = ['Theory Answers', 'Case Studies', 'Introductions', 'Conclusions'];
        const primaryContainer = document.createElement('div');
        primaryContainer.style = 'display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #e2e8f0;';
        
        // Add "All Materials" button first
        const allBtn = document.createElement('button');
        allBtn.className = 'btn-qb-filter active';
        allBtn.setAttribute('data-cat', 'all');
        allBtn.style = `padding:8px 14px; border-radius:20px; border:1px solid #94a3b8; background:#1e293b; color:white; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 4px 6px rgba(0,0,0,0.1);`;
        allBtn.innerHTML = `📚 All Materials`;
        allBtn.onclick = () => window.loadQuoteBankFiles('all');
        primaryContainer.appendChild(allBtn);

        primaryTypes.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'btn-qb-filter';
          btn.setAttribute('data-cat', cat);
          let bg = '#eff6ff', color = '#2563eb', border = '#bfdbfe';
          if(cat === 'Theory Answers') { bg = '#eff6ff'; color = '#2563eb'; border = '#bfdbfe'; }
          if(cat === 'Case Studies') { bg = '#f0fdf4'; color = '#16a34a'; border = '#bbf7d0'; }
          if(cat === 'Introductions') { bg = '#fffbeb'; color = '#d97706'; border = '#fde68a'; }
          if(cat === 'Conclusions') { bg = '#faf5ff'; color = '#9333ea'; border = '#e9d5ff'; }
          btn.style = `padding:8px 14px; border-radius:20px; border:1px solid ${border}; background:${bg}; color:${color}; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; align-items:center; gap:6px;`;
          btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; };
          btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; };
          btn.innerHTML = `${cat}`;
          btn.onclick = () => window.loadQuoteBankFiles(cat);
          primaryContainer.appendChild(btn);
        });
        
        // Secondary Categories (Ethics, Thinkers, etc.)
        const secondaryContainer = document.createElement('div');
        secondaryContainer.style = 'display:flex; flex-wrap:wrap; gap:8px;';
        
        dynamicCats.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'btn-qb-filter';
          btn.setAttribute('data-cat', cat);
          btn.style = 'padding:8px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#334155; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; align-items:center; gap:6px;';
          btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; btn.style.borderColor = '#94a3b8'; };
          btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; btn.style.borderColor = '#cbd5e1'; };
          btn.innerHTML = `📄 ${cat}`;
          btn.onclick = () => window.loadQuoteBankFiles(cat);
          secondaryContainer.appendChild(btn);
        });
        
        qbFiltersContainer.appendChild(primaryContainer);
        qbFiltersContainer.appendChild(secondaryContainer);
      }

      // 3. Populate CMS Categorize Buttons (With Primary Types)
      const cmsButtonsContainer = document.getElementById('dynamic-cat-buttons');
      if (cmsButtonsContainer && dynamicCats.length > 0) {
        cmsButtonsContainer.innerHTML = '';
        
        // Primary Types (Theory, Case Studies, etc.)
        const primaryTypes = ['Theory Answers', 'Case Studies', 'Introductions', 'Conclusions'];
        const primaryContainer = document.createElement('div');
        primaryContainer.style = 'display:flex; flex-wrap:wrap; gap:10px; margin-bottom:15px; padding-bottom:15px; border-bottom:1px solid #e2e8f0;';
        
        primaryTypes.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'btn-cat-assign';
          btn.setAttribute('data-cat', cat);
          let bg = '#eff6ff', color = '#2563eb', border = '#bfdbfe';
          if(cat === 'Theory Answers') { bg = '#eff6ff'; color = '#2563eb'; border = '#bfdbfe'; }
          if(cat === 'Case Studies') { bg = '#f0fdf4'; color = '#16a34a'; border = '#bbf7d0'; }
          if(cat === 'Introductions') { bg = '#fffbeb'; color = '#d97706'; border = '#fde68a'; }
          if(cat === 'Conclusions') { bg = '#faf5ff'; color = '#9333ea'; border = '#e9d5ff'; }
          btn.style = `padding:8px 14px; border-radius:20px; border:1px solid ${border}; background:${bg}; color:${color}; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; align-items:center; gap:6px;`;
          btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; };
          btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; };
          btn.innerHTML = `${cat}`;
          primaryContainer.appendChild(btn);
        });
        
        // Secondary Categories (Ethics, Thinkers, etc.)
        const secondaryContainer = document.createElement('div');
        secondaryContainer.style = 'display:flex; flex-wrap:wrap; gap:8px;';
        
        dynamicCats.forEach(cat => {
          const btn = document.createElement('button');
          btn.className = 'btn-cat-assign';
          btn.setAttribute('data-cat', cat);
          btn.style = 'padding:8px 14px; border-radius:20px; border:1px solid #cbd5e1; background:white; color:#334155; cursor:pointer; font-weight:600; font-size:0.85rem; transition:all 0.2s; box-shadow:0 2px 4px rgba(0,0,0,0.02); display:flex; align-items:center; gap:6px;';
          btn.onmouseover = () => { btn.style.transform = 'translateY(-2px)'; btn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)'; btn.style.borderColor = '#94a3b8'; };
          btn.onmouseout = () => { btn.style.transform = 'translateY(0)'; btn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; btn.style.borderColor = '#cbd5e1'; };
          btn.innerHTML = `📄 ${cat}`;
          secondaryContainer.appendChild(btn);
        });
        
        cmsButtonsContainer.appendChild(primaryContainer);
        cmsButtonsContainer.appendChild(secondaryContainer);
      } else if (cmsButtonsContainer) {
        cmsButtonsContainer.innerHTML = '<p style="color:#ef4444; font-size:0.9rem;">No categories found. Please run categories updater.</p>';
      }

      // 4. Attach Event Listeners to Sidebar
      if (qbCategoriesList) {
        qbCategoriesList.querySelectorAll('li').forEach(li => {
          li.addEventListener('click', () => {
            const cat = li.getAttribute('data-cat');
            window.loadQuoteBankFiles(cat);
          });
        });
      }
      
      // 5. Use Event Delegation for dynamic CMS buttons
      if (cmsButtonsContainer) {
        cmsButtonsContainer.addEventListener('click', (e) => {
          const btn = e.target.closest('.btn-cat-assign');
          if (!btn) return;
          if(typeof selectedFileForCMS === 'undefined' || !selectedFileForCMS) { 
            alert('⚠️ You have not selected a file!\n\n1. If you see folders (📁), click "Open Folder ➔" to go inside them.\n2. When you see a file (📄), click on it to select it (it will turn blue).\n3. Then, click this category button to assign it.'); 
            return; 
          }
          const cat = btn.getAttribute('data-cat');
          const fileObj = {
            id: selectedFileForCMS.id,
            name: selectedFileForCMS.name,
            link: `https://drive.google.com/file/d/${selectedFileForCMS.id}/preview`,
            category: cat
          };
          
          let stored = localStorage.getItem('quoteBankFiles');
          let arr = stored ? JSON.parse(stored) : [];
          if(!arr.find(x => x.id === fileObj.id)) {
            arr.push(fileObj);
            localStorage.setItem('quoteBankFiles', JSON.stringify(arr));
          }
          if (window.loadAssignedCMS) window.loadAssignedCMS();
        });
      }
    });
    // --- RONE RANKERS LOGIC ---
    const GAS_URL = "https://script.google.com/macros/s/AKfycbx0Gg-U9MLuqE352oz9gfIYiYzqvQd3cmS6ndZ7pGd-giGHshi6I_OI1XQ_EaZ1XhHS/exec"; // Central GAS URL
    let rankersBreadcrumbs = [];

    window.loadRankersFolder = async function(folderId, folderName) {
      if(folderId === 'ROOT') {
        rankersBreadcrumbs = [{id: '15UinxbrX7EY4tcpiDuXUkiWT_VKEsc1d', name: "🏠 RONE Ranker's Root"}];
      } else {
        // If clicking an existing breadcrumb, truncate the array
        const idx = rankersBreadcrumbs.findIndex(b => b.id === folderId);
        if(idx !== -1) {
          rankersBreadcrumbs = rankersBreadcrumbs.slice(0, idx + 1);
        } else {
          rankersBreadcrumbs.push({id: folderId, name: folderName});
        }
      }

      // Update Breadcrumbs UI
      const bcContainer = document.getElementById('rankers-breadcrumb');
      if(bcContainer) {
        bcContainer.innerHTML = '';
        rankersBreadcrumbs.forEach((bc, idx) => {
          const btn = document.createElement('button');
          btn.style = 'background:none; border:none; color:#3b82f6; font-weight:700; cursor:pointer; font-size:0.9rem; display:flex; align-items:center; gap:6px;';
          if(idx === rankersBreadcrumbs.length - 1) {
            btn.style.color = '#1e293b'; // Current folder
            btn.style.cursor = 'default';
          }
          btn.innerHTML = (idx === 0 ? '🏠 ' : '') + bc.name;
          if(idx < rankersBreadcrumbs.length - 1) {
            btn.onclick = () => window.loadRankersFolder(bc.id, bc.name);
          }
          bcContainer.appendChild(btn);

          if(idx < rankersBreadcrumbs.length - 1) {
            const sep = document.createElement('span');
            sep.textContent = '>';
            sep.style.color = '#94a3b8';
            sep.style.fontSize = '0.8rem';
            bcContainer.appendChild(sep);
          }
        });
      }

      const grid = document.getElementById('rankers-grid');
      const loader = document.getElementById('rankers-loader');
      if(!grid || !loader) return;

      grid.innerHTML = '';
      loader.style.display = 'block';

      if(GAS_URL === "YOUR_GOOGLE_APPS_SCRIPT_URL_HERE") {
        loader.style.display = 'none';
        grid.innerHTML = `<p style="grid-column:1/-1; color:#ef4444; font-weight:bold; text-align:center;">Please deploy the Google Apps Script and paste the URL in aspirant-dashboard.html (Search for YOUR_GOOGLE_APPS_SCRIPT_URL_HERE).</p>`;
        return;
      }

      const targetId = rankersBreadcrumbs[rankersBreadcrumbs.length - 1].id;

      try {
        const res = await fetch(`${GAS_URL}?folderId=${targetId}`);
        const data = await res.json();
        
        loader.style.display = 'none';
        
        if(data.error) throw new Error(data.error);

        const items = Array.isArray(data) ? data : (data.data || []);
        if(items.length === 0) {
          grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#64748b;">This folder is empty.</p>`;
          return;
        }

        items.forEach(item => {
          const card = document.createElement('div');
          card.style.cssText = `
            cursor: pointer;
            border-radius: 18px;
            padding: 22px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 8px 25px -5px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.5);
            backdrop-filter: blur(12px);
          `;
          
          if(item.type === 'folder') {
            card.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            card.style.color = 'white';
            card.innerHTML = `
              <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
              <div style="position:absolute;bottom:-30px;left:-20px;width:120px;height:120px;background:rgba(255,255,255,0.06);border-radius:50%;"></div>
              <div style="font-size:2.2rem;margin-bottom:12px;position:relative;z-index:1;">📁</div>
              <h3 style="margin:0 0 6px;font-size:1rem;font-weight:700;color:white;position:relative;z-index:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.name}">${item.name}</h3>
              <p style="margin:0 0 16px;font-size:0.82rem;color:rgba(255,255,255,0.75);position:relative;z-index:1;">Folder</p>
              <div style="margin-top:auto;position:relative;z-index:1;">
                <button style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:7px 18px;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;backdrop-filter:blur(5px);transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Open Folder →</button>
              </div>
            `;
            card.onclick = () => window.loadRankersFolder(item.id, item.name);
          } else {
            card.style.background = 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)';
            card.style.color = 'white';
            card.innerHTML = `
              <div style="position:absolute;top:-20px;right:-20px;width:100px;height:100px;background:rgba(255,255,255,0.1);border-radius:50%;"></div>
              <div style="position:absolute;bottom:-30px;left:-20px;width:120px;height:120px;background:rgba(255,255,255,0.06);border-radius:50%;"></div>
              <div style="font-size:2.2rem;margin-bottom:12px;position:relative;z-index:1;">📄</div>
              <h3 style="margin:0 0 6px;font-size:1rem;font-weight:700;color:white;position:relative;z-index:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${item.name}">${item.name}</h3>
              <p style="margin:0 0 16px;font-size:0.82rem;color:rgba(255,255,255,0.75);position:relative;z-index:1;">PDF Document</p>
              <div style="margin-top:auto;position:relative;z-index:1;">
                <button style="background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.4);color:white;padding:7px 18px;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;backdrop-filter:blur(5px);transition:0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.35)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">Read PDF →</button>
              </div>
            `;
            // Modify standard drive link for preview
            let embedLink = `https://drive.google.com/file/d/${item.id}/preview`;
            card.onclick = () => {
              if (typeof window.openPdfModal === 'function') {
                window.openPdfModal(item.name, embedLink);
              } else if (typeof openPdfModal === 'function') {
                openPdfModal(item.name, embedLink);
              } else {
                console.error("openPdfModal function not found");
              }
            };
          }
          grid.appendChild(card);
        });
      } catch(err) {
        console.error(err);
        loader.style.display = 'none';
        grid.innerHTML = `<p style="grid-column:1/-1; color:#ef4444; font-weight:bold; text-align:center;">Failed to load folder: ${err.message}</p>`;
      }
    };



    window.openPaymentModal = function(id, name, fee) {
      document.getElementById('pay-course-id').value = id;
      document.getElementById('pay-course-name').value = name;
      document.getElementById('pay-course-fee').value = fee;
      document.getElementById('pay-amount-display').textContent = 'Pay: ₹' + parseInt(fee).toLocaleString('en-IN');
      document.getElementById('pay-utr').value = '';
      document.getElementById('payment-modal').style.display = 'flex';
    };

    window.closePaymentModal = function() {
      document.getElementById('payment-modal').style.display = 'none';
    };

    window.submitPayment = async function() {
      const utr = document.getElementById('pay-utr').value.trim();
      if (!utr) { alert("Please enter the UTR / Transaction ID"); return; }
      if (utr.length < 8) { alert("UTR must be valid."); return; }
      
      const btn = document.getElementById('btn-submit-payment');
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      const id = document.getElementById('pay-course-id').value;
      const name = document.getElementById('pay-course-name').value;
      const fee = document.getElementById('pay-course-fee').value;

      try {
        const txId = Date.now().toString();
        await setDoc(doc(db, 'transactions', txId), {
          student: _currentUserEmail || 'Unknown Aspirant',
          course: name,
          courseId: id,
          amount: parseInt(fee),
          date: new Date().toISOString().split('T')[0],
          mode: 'UPI',
          status: 'Pending',
          notes: 'UTR: ' + utr,
          createdAt: new Date().toISOString()
        });
        
        alert("✅ Payment Submitted! Your UTR has been sent for verification. You will get course access once the Admin approves it.");
        window.closePaymentModal();
        window.loadCoursesList(); // Reload to show Pending status
      } catch (err) {
        console.error(err);
        alert("❌ Failed to submit payment. Please try again.");
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Payment for Verification';
      }
    };

    
      window.submitAnswerPremium = async function(courseId, courseName) {
        const title = document.getElementById('ans-title-' + courseId).value.trim();
        const link = document.getElementById('ans-link-' + courseId).value.trim();
        if(!title || !link) {
          alert('Please provide both the Title and the Google Drive Link.');
          return;
        }
        
        try {
          const resolvedStudentName = _currentUserName || _currentUserEmail.split('@')[0];
          await addDoc(collection(db, 'evaluations'), {
            student: _currentUserEmail,
            studentName: resolvedStudentName,
            studentId: _currentUserEmail,
            title: title,
            link: link,
            courseId: courseId,
            courseName: courseName,
            status: 'Pending',
            score: null,
            feedback: '',
            submittedAt: new Date().toISOString()
          });
          alert('✅ Your answer PDF has been successfully submitted for evaluation!');
          document.getElementById('ans-title-' + courseId).value = '';
          document.getElementById('ans-link-' + courseId).value = '';
        } catch (e) {
          console.error(e);
          alert('❌ Error submitting answer. Please try again.');
        }
      };

      window.loadCoursesList = async function() {
      const grid = document.getElementById('available-courses-grid');
      if (!grid) return;
      grid.innerHTML = '<p style="color:#64748b;">Loading...</p>';
      
      try {
        // 1. Fetch user's transactions
        const txSnap = await getDocs(query(collection(db, 'transactions'), where('student', '==', _currentUserEmail)));
        const userEnrollments = {};
        txSnap.forEach(t => {
           const td = t.data();
           // If Paid, it overrides Pending
           if (td.status === 'Paid') userEnrollments[td.courseId] = 'Paid';
           else if (td.status === 'Pending' && userEnrollments[td.courseId] !== 'Paid') userEnrollments[td.courseId] = 'Pending';
        });

        // 2. Fetch active courses
        const cSnap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'Active')));
        let html = '';
        
        cSnap.forEach(d => {
          const c = d.data();
          const id = d.id;
          const status = userEnrollments[id];
          
          let actionBtn = `<button onclick="window.openPaymentModal('${id}', '${c.name.replace(/'/g, "\'")}', '${c.fee}')" style="width:100%; padding:10px; background:#3b82f6; color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer;">₹${parseInt(c.fee).toLocaleString('en-IN')} - Buy Now</button>`;
          
          if (status === 'Paid') {
             actionBtn = `
<button disabled style="width:100%; padding:10px; background:#dcfce7; color:#166534; border:1px solid #166534; border-radius:6px; font-weight:600; cursor:not-allowed;">✅ Enrolled</button>
`;
          } else if (status === 'Pending') {
             actionBtn = `<button disabled style="width:100%; padding:10px; background:#fef9c3; color:#854d0e; border:1px solid #854d0e; border-radius:6px; font-weight:600; cursor:not-allowed;">⏳ Verification Pending</button>`;
          }

          html += `
            <div class="stat-card" style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <span style="background:#f1f5f9; color:#475569; padding:4px 8px; border-radius:4px; font-size:0.75rem; font-weight:600;">${c.category || 'Course'}</span>
                <h3 style="margin:8px 0 4px; font-size:1.1rem; color:#0f172a;">${c.name}</h3>
                <p style="margin:0; font-size:0.85rem; color:#64748b;">${c.description || 'No description available.'}</p>
              </div>
              <div style="font-size:0.85rem; color:#64748b;">
                <strong>Seats:</strong> ${c.enrolled || 0}/${c.seats} <br>
                <strong>Starts:</strong> ${c.startDate || 'N/A'}
              </div>
              <div style="margin-top:auto; padding-top:12px; border-top:1px solid #e2e8f0;">
                ${actionBtn}
              </div>
            </div>
          `;
        });
        
        grid.innerHTML = html || '<p style="color:#64748b;">No active courses found.</p>';
      } catch(err) {
        console.error(err);
        grid.innerHTML = '<p style="color:#ef4444;">Failed to load courses.</p>';
      }
    };
    
    window.submitAnswer = async function() {
      const title = document.getElementById('ans-title').value.trim();
      const subject = document.getElementById('ans-subject').value.trim();
      const topic = document.getElementById('ans-topic').value.trim();
      const fileInput = document.getElementById('ans-file');
      const topperSelect = document.getElementById('ans-topper');
      const topperName = topperSelect ? topperSelect.value : '';
      
      if(!subject) { alert('Please select a Subject.'); return; }
      if(!title) { alert('Please enter a Submission Title.'); return; }
      if(!fileInput.files.length) { alert('Please select a PDF file to upload.'); return; }
      const topicFinal = topic || 'General';
      
      const file = fileInput.files[0];
      if(file.type !== 'application/pdf') { alert('Only PDF files are allowed.'); return; }
      if(file.size > 49 * 1024 * 1024) { alert('File size must be less than 49MB.'); return; }

      const btn = document.getElementById('btn-submit-ans');
      const progressContainer = document.getElementById('upload-progress-container');
      const progressBar = document.getElementById('upload-bar');
      const progressPercent = document.getElementById('upload-percent');

      btn.disabled = true; 
      btn.textContent = 'Uploading to Google Drive...';
      progressContainer.style.display = 'block';
      progressBar.style.width = '30%';
      progressPercent.textContent = 'Processing file...';
      
      try {
        // Read file as Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async function() {
          const base64Data = reader.result.split(',')[1];
          
          progressBar.style.width = '60%';
          progressPercent.textContent = 'Sending to Drive...';
          
          const scriptURL = "https://script.google.com/macros/s/AKfycbyCYIKq5vx5_PhjYyEG6und4aP3Uua9aaVaZR0JUm9KcWbBUC5ZFC1dLC5NUWqc9TY8/exec";
          
          const formData = new URLSearchParams();
          formData.append('fileData', base64Data);
          formData.append('mimeType', file.type);
          const resolvedStudentName = _currentUserName || _currentUserEmail.split('@')[0];
          formData.append('fileName', `${resolvedStudentName} - ${file.name}`);
          formData.append('studentName', resolvedStudentName);
          formData.append('subject', subject);
          formData.append('topic', topicFinal);
          formData.append('courseName', subject); // for backward compat
          formData.append('submissionTitle', title);
          if (topperName) formData.append('topperName', topperName);

          try {
            const response = await fetch(scriptURL, {
              method: 'POST',
              body: formData
            });
            
            const result = await response.json();
            
            if(result.status === "success") {
              progressBar.style.width = '100%';
              progressPercent.textContent = '100%';
              
              // Save to Firestore
              const docId = Date.now().toString();
              await setDoc(doc(db, 'evaluations', docId), {
                studentName: _currentUserName || _currentUserEmail.split('@')[0],
                studentId: _currentUserEmail,
                title: title,
                subject: subject,
                topic: topicFinal,
                link: result.url,
                fileName: file.name,
                status: 'Draft',
                timestamp: new Date().toISOString()
              });
              
              alert('✅ Answer successfully uploaded to Google Drive and submitted!');
              document.getElementById('ans-title').value = '';
              document.getElementById('ans-subject').value = '';
              document.getElementById('ans-topic').value = '';
              fileInput.value = '';
              progressContainer.style.display = 'none';
              window.loadMyAnswers();
            } else {
              throw new Error(result.message || 'Apps Script returned an error.');
            }
          } catch(e) {
            console.error(e);
            alert('Upload failed: ' + e.message);
            progressContainer.style.display = 'none';
          } finally {
            btn.disabled = false;
            btn.textContent = '🚀 Submit for Evaluation';
          }
        };
        
        reader.onerror = function(error) {
          console.error(error);
          alert('Error reading file.');
          btn.disabled = false; 
          btn.textContent = 'Submit for Evaluation';
          progressContainer.style.display = 'none';
        };

      } catch (err) {
        console.error(err);
        alert('Failed to initialize upload.');
        btn.disabled = false; 
        btn.textContent = 'Submit for Evaluation';
        progressContainer.style.display = 'none';
      }
    };
    
    window.triggerOMRUpload = function(e_obj, testId, testTopic) {
      const btn = e_obj.currentTarget || e_obj.target;
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'application/pdf,image/*';
      fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        if(file.size > 49 * 1024 * 1024) { alert('File size must be less than 49MB.'); return; }
        
        const oldText = btn.textContent;
        btn.textContent = 'Uploading...';
        btn.style.pointerEvents = 'none';
        
        try {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = async function() {
            const base64Data = reader.result.split(',')[1];
            const scriptURL = "https://script.google.com/macros/s/AKfycbwIV4Nt5t9ZMsJgyvcCa-V4UfhMNToZ5fQZe-AJutNLUaAUvAVnMMQA4XrOR1FdoeI_bw/exec";
            
            const formData = new URLSearchParams();
            formData.append('fileData', base64Data);
            formData.append('mimeType', file.type);
            formData.append('fileName', `OMR_${_currentUserEmail.split('@')[0]}_${testTopic}_${Date.now()}`);
            formData.append('studentName', _currentUserEmail);
            formData.append('courseName', 'Test_OMR');

            const response = await fetch(scriptURL, {
              method: 'POST',
              body: formData
            });
            const result = await response.json();
            
            if(result.status === "success") {
               await addDoc(collection(db, 'evaluations'), {
                   studentEmail: _currentUserEmail,
                   studentName: _currentUserEmail.split('@')[0],
                   subject: "Test OMR",
                   topic: testTopic,
                   title: "OMR: " + testTopic,
                   pdfLink: result.url,
                   status: "Pending",
                   submittedAt: new Date().toISOString()
               });
               alert('✅ OMR Uploaded successfully! Mentor will evaluate it.');
            } else {
               throw new Error(result.message);
            }
            btn.textContent = oldText;
            btn.style.pointerEvents = 'auto';
          };
          reader.onerror = () => { throw new Error('File reading failed'); };
        } catch(err) {
           console.error(err);
           alert('❌ Upload failed: ' + err.message);
           btn.textContent = oldText;
           btn.style.pointerEvents = 'auto';
        }
      };
      fileInput.click();
    };

    window.deleteSubmission = async function(docId) {
      if(confirm('Are you sure you want to delete this submission?')) {
        try {
          await deleteDoc(doc(db, 'evaluations', docId));
          alert('Submission deleted.');
          window.loadMyAnswers();
        } catch(e) {
          console.error(e);
          alert('Failed to delete.');
        }
      }
    };
    
    window.openViewModal = function(docId) {
      const ev = window.myEvalDataMap && window.myEvalDataMap[docId];
      if(!ev) return;
      document.getElementById('view-eval-subject').textContent = ev.subject || '-';
      document.getElementById('view-eval-topic').textContent = ev.topic || '-';
      document.getElementById('view-eval-marks').textContent = ev.marks || '0';
      document.getElementById('view-eval-feedback').textContent = ev.feedback || 'No feedback provided yet.';
      
      let previewLink = ev.link || '';
      if (previewLink && previewLink.includes('drive.google.com') && previewLink.includes('/view')) {
        previewLink = previewLink.replace('/view', '/preview');
      } else if (previewLink && previewLink.includes('drive.google.com') && !previewLink.includes('/preview')) {
        previewLink = previewLink + '/preview';
      }
      document.getElementById('view-pdf-frame').src = previewLink;
      
      document.getElementById('btn-view-annotated').href = ev.link || '#';
      document.getElementById('view-eval-modal').style.display = 'flex';
    };

    window.closeViewModal = function() {
      document.getElementById('view-eval-modal').style.display = 'none';
      document.getElementById('view-pdf-frame').src = '';
    };

    window.loadMyAnswers = async function() {
      const tbody = document.getElementById('answers-table-body');
      if(!tbody) return;
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#64748b;">Loading...</td></tr>';
      
      try {
        const snap = await getDocs(query(collection(db, 'evaluations'), where('studentId', '==', _currentUserEmail)));
        let html = '';
        let total = 0, evald = 0, pend = 0;
        let sumScore = 0, scoredCount = 0;
        snap.forEach(d => {
          const ev = d.data();
          const docId = d.id;
          total++;
          if(ev.status === 'Evaluated' || ev.status === 'Completed' || ev.status === 'Graded') evald++;
          else pend++;
          if(ev.marks) {
            sumScore += parseFloat(ev.marks);
            scoredCount++;
          }
          const dStr = new Date(ev.timestamp).toLocaleDateString('en-IN');
          
          // Status badge color
          let badgeStyle = 'background:#f1f5f9;color:#475569'; // Draft
          if(ev.status === 'Submitted') badgeStyle = 'background:#dbeafe;color:#1d4ed8';
          if(ev.status === 'Evaluated' || ev.status === 'Completed' || ev.status === 'Graded') badgeStyle = 'background:#dcfce7;color:#166534';
          
          // Action button
          let actionBtn = '';
          if(ev.status === 'Draft') {
            actionBtn = `<button onclick="window.finalSubmitToMentor('${docId}')" style="padding:7px 14px; background:linear-gradient(135deg,#10b981,#059669); color:white; border:none; border-radius:8px; font-size:0.8rem; font-weight:700; cursor:pointer; white-space:nowrap; box-shadow:0 2px 8px rgba(16,185,129,0.3); transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">✅ Final Submit to Mentor</button>`;
          } else if(ev.status === 'Submitted') {
            actionBtn = `<span style="font-size:0.8rem; color:#1d4ed8; font-weight:600;">⏳ Awaiting Review</span>`;
          } else {
            window.myEvalDataMap = window.myEvalDataMap || {};
            window.myEvalDataMap[docId] = ev;
            actionBtn = `<button onclick="window.openViewModal('${docId}')" style="padding:7px 14px; background:linear-gradient(135deg,#3b82f6,#2563eb); color:white; border:none; border-radius:8px; font-size:0.8rem; font-weight:700; cursor:pointer; white-space:nowrap; box-shadow:0 2px 8px rgba(37,99,235,0.3); transition:transform 0.15s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">👁️ View Result</button>`;
          }

          if (ev.status !== 'Evaluated' && ev.status !== 'Completed' && ev.status !== 'Graded') {
            let deleteBtn = `<button onclick="window.deleteSubmission('${docId}')" style="margin-top:4px; padding:4px 8px; background:#ef4444; color:white; border:none; border-radius:4px; font-size:0.7rem; cursor:pointer;" title="Delete Submission">🗑️ Delete</button>`;
            actionBtn = `<div style="display:flex; flex-direction:column; gap:4px; align-items:center;">${actionBtn}${deleteBtn}</div>`;
          } else {
            actionBtn = `<div style="display:flex; flex-direction:column; gap:4px; align-items:center;">${actionBtn}</div>`;
          }

          html += `<tr style="border-bottom:1px solid #f1f5f9; transition: background 0.15s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
            <td style="padding:12px; font-size:0.85rem; font-weight:600; color:#1e293b;">${ev.subject || '-'}</td>
            <td style="padding:12px; font-size:0.85rem; color:#475569;">${ev.topic || '-'}</td>
            <td style="padding:12px;"><a href="${ev.link}" target="_blank" style="color:#3b82f6;text-decoration:none;font-weight:500; display:flex; align-items:center; gap:4px;">📄 ${ev.title}</a></td>
            <td style="padding:12px; font-size:0.82rem; color:#64748b;">${dStr}</td>
            <td style="padding:12px;"><span style="padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700; ${badgeStyle};">${ev.status}</span></td>
            <td style="padding:12px; font-weight:700; color:#0f172a;">${ev.marks ? ev.marks+'/100' : '-'}</td>
            <td style="padding:12px; font-size:0.82rem; color:#64748b; max-width:180px;">${ev.feedback || '-'}</td>
            <td style="padding:12px;">${actionBtn}</td>
          </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">No submissions yet. Upload your first answer above! 📝</td></tr>';
        if(document.getElementById('stat-ans-total')) document.getElementById('stat-ans-total').textContent = total;
        if(document.getElementById('stat-ans-eval')) document.getElementById('stat-ans-eval').textContent = evald;
        if(document.getElementById('stat-ans-pend')) document.getElementById('stat-ans-pend').textContent = pend;

        // Update Performance Analytics in Report section
        const avgScore = scoredCount > 0 ? (sumScore / scoredCount).toFixed(1) : '0';
        const reportEvald = document.getElementById('report-ans-eval');
        if (reportEvald) reportEvald.textContent = evald;
        const reportPend = document.getElementById('report-ans-pend');
        if (reportPend) reportPend.textContent = pend;
        const reportAvg = document.getElementById('report-ans-avg-num');
        if (reportAvg) reportAvg.textContent = `${avgScore}`;

        if(document.getElementById('report-top-eval')) document.getElementById('report-top-eval').textContent = evald;
        if(document.getElementById('report-top-pend')) document.getElementById('report-top-pend').textContent = pend;
        if(document.getElementById('report-top-avg')) document.getElementById('report-top-avg').textContent = `${avgScore} / 100`;
        if(document.getElementById('report-ans-avg-bar')) document.getElementById('report-ans-avg-bar').style.width = `${avgScore}%`;
      } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#ef4444;">Failed to load.</td></tr>';
      }
    };

    window.finalSubmitToMentor = async function(docId) {
      if(!confirm('Are you sure you want to submit this answer to your Mentor for evaluation? You cannot undo this.')) return;
      try {
        await setDoc(doc(db, 'evaluations', docId), { status: 'Submitted', submittedAt: new Date().toISOString() }, { merge: true });
        alert('✅ Successfully submitted to Mentor! Your mentor will evaluate it shortly.');
        window.loadMyAnswers();
      } catch(err) {
        console.error(err);
        alert('❌ Failed to submit. Please try again.');
      }
    };

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce Aspirant Role
        let role = 'Aspirant';
        const emailLower = user.email.toLowerCase();
        
        try {
          const roleDoc = await getDoc(doc(db, 'userRoles', emailLower));
          if (roleDoc.exists()) role = roleDoc.data().role || 'Aspirant';
        } catch (err) {}
        
        if (role.toLowerCase() !== 'aspirant') {
          window.location.href = '../index.html';
          return;
        }

        // Setup Globals
        _currentUserEmail = emailLower;
        
        let displayName = user.displayName;
        if (!displayName) {
          try {
            // Try fetching from users collection
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists() && userDoc.data().name) {
              displayName = userDoc.data().name;
            } else {
              // Try userRoles as fallback
              if (roleDoc.exists() && roleDoc.data().name) {
                displayName = roleDoc.data().name;
              }
            }
          } catch(e) {}
        }
        
        try {
          const stus = JSON.parse(localStorage.getItem('rone_students') || '[]');
          const myData = stus.find(s => s.email.toLowerCase() === emailLower);
          if (myData && myData.name) {
            displayName = myData.name;
          }
        } catch(e) {}

        const namePart = displayName || user.email.split('@')[0];
        _currentUserName = namePart;
        const initial = namePart.charAt(0).toUpperCase();

        document.getElementById('welcome-message').textContent = `Welcome back, ${namePart}! 👋`;
        const topbarAvatar = document.getElementById('topbar-avatar');
        if (topbarAvatar) topbarAvatar.textContent = initial;

        // Attach ID Card logic
        window.showIdCardModal = async function() {
          const m = document.getElementById('id-card-modal');
          if(!m) return;
          document.getElementById('id-card-avatar').textContent = initial;
          document.getElementById('id-card-name').textContent = namePart;
          document.getElementById('id-card-role').textContent = 'Aspirant';
          document.getElementById('id-card-email').textContent = emailLower;
          
          const detailsBox = document.getElementById('id-card-details');
          if (detailsBox) detailsBox.style.display = 'block';
          
          try {
            let foundData = false;
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if(userDoc.exists()) {
              const data = userDoc.data();
              if(data.name) {
                document.getElementById('id-card-name').textContent = data.name;
                document.getElementById('id-card-avatar').textContent = data.name.charAt(0).toUpperCase();
              }
              // Only mark found if fields exist
              if (data.target || data.class || data.medium || data.stream) {
                document.getElementById('id-card-target').textContent = data.target || data.class || '-';
                document.getElementById('id-card-medium').textContent = data.medium || data.stream || '-';
                document.getElementById('id-card-optional').textContent = data.optional || data.subject || '-';
                document.getElementById('id-card-exam').textContent = data.exam || data.goal || '-';
                foundData = true;
              }
            }
            
            if (!foundData) {
              const stus = JSON.parse(localStorage.getItem('rone_students') || '[]');
              const myData = stus.find(s => s.email.toLowerCase() === emailLower);
              if (myData) {
                if(myData.name) {
                  document.getElementById('id-card-name').textContent = myData.name;
                  document.getElementById('id-card-avatar').textContent = myData.name.charAt(0).toUpperCase();
                }
                document.getElementById('id-card-target').textContent = myData.class || '-';
                document.getElementById('id-card-medium').textContent = myData.stream || '-';
                document.getElementById('id-card-optional').textContent = myData.subject || '-';
                document.getElementById('id-card-exam').textContent = myData.goal || '-';
              } else {
                document.getElementById('id-card-target').textContent = '-';
                document.getElementById('id-card-medium').textContent = '-';
                document.getElementById('id-card-optional').textContent = '-';
                document.getElementById('id-card-exam').textContent = '-';
              }
            }
          } catch (e) {
            console.error('Error fetching ID card details:', e);
          }
          
          m.style.display = 'flex';
        };

        initSessionManager(auth, signOut, '../index.html');
        
        // Setup Logout
        const btnLogoutTop = document.getElementById('btnLogoutTop');
        if (btnLogoutTop) btnLogoutTop.addEventListener('click', () => signOut(auth).then(() => window.location.href = '../index.html'));

        if (typeof fetchLatestPlanner === 'function') fetchLatestPlanner();
        if (typeof fetchTodayTasks === 'function') fetchTodayTasks();
        if (typeof fetchProgress === 'function') fetchProgress();
      } else {
        window.location.href = '../index.html';
      }
    });



    function getISTDateStr() {
      const d = new Date();
      d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + 330); // IST is +5:30
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }

function fetchLatestPlanner() {
      const loadingText = document.getElementById('planner-loading');
      const plannerImg = document.getElementById('daily-planner-img');
      
      const todayStr = getISTDateStr();
      const specificImgUrl = `https://raw.githubusercontent.com/RONESIRVI/RAS-Study-Planner/main/output/plan_${todayStr}.png?t=${Date.now()}`;
      const defaultImgUrl = `https://raw.githubusercontent.com/RONESIRVI/RAS-Study-Planner/main/output/Pillar_Schedule.png?t=${Date.now()}`;
      
      const tempImg = new Image();
      tempImg.onload = () => {
         plannerImg.src = specificImgUrl;
         loadingText.style.display = 'none';
         plannerImg.style.display = 'block';
      };
      tempImg.onerror = () => {
         // Fallback if today's image is not found
         plannerImg.src = defaultImgUrl;
         loadingText.style.display = 'none';
         plannerImg.style.display = 'block';
      };
      tempImg.src = specificImgUrl;
    }
async function fetchTodayTasks() {
      const taskList = document.getElementById('action-plan-list');
      if (!taskList) return;
      
      const todayStr = getISTDateStr();
      const specificJsonUrl = `https://raw.githubusercontent.com/RONESIRVI/RAS-Study-Planner/main/output/plan_${todayStr}.json?t=${Date.now()}`;
      const defaultJsonUrl = `https://raw.githubusercontent.com/RONESIRVI/RAS-Study-Planner/main/output/todays_tasks.json?t=${Date.now()}`;

      try {
        let response = await fetch(specificJsonUrl);
        if (!response.ok) {
           console.log("Specific date plan not found, falling back to todays_tasks.json");
           response = await fetch(defaultJsonUrl);
        }
        if (!response.ok) throw new Error("Failed to fetch tasks JSON");
        
        const data = await response.json();
        taskList.innerHTML = ''; // Clear loading text
        
        let hasTasks = false;
        
        const TIME_MAP = {
          'CLASSES': 150,   // 2.5 hrs = 150 min
          'REVISION': 45,   // 45 min
          'PYQ TEST': 60,   // 60 min
          'MOCK TEST': 45,  // 45 min
          'ANALYSIS': 30,   // 30 min
        };

        const todayStr = getISTDateStr(); // for localStorage key prefix
        
        function generateTaskId(type, subject, topic) {
          const str = `${type}-${subject || ''}-${topic || ''}`;
          // Convert to base64, removing padding to make it safe for DOM IDs
          return 'task-' + todayStr + '-' + btoa(unescape(encodeURIComponent(str))).replace(/=/g, '');
        }

        // Helper function to get minutes for a task type
        function getMinutesForTask(taskName) {
          const upper = (taskName || '').toUpperCase();
          if (upper.startsWith('CLASSES')) return TIME_MAP['CLASSES'];
          if (upper === 'REVISION') return TIME_MAP['REVISION'];
          if (upper === 'PYQ TEST') return TIME_MAP['PYQ TEST'];
          if (upper === 'MOCK TEST') return TIME_MAP['MOCK TEST'];
          if (upper.includes('ANALYSIS')) return TIME_MAP['ANALYSIS'];
          return 0;
        }

        data.forEach(item => {
          if (item.task === 'REVISION') {
            if (item.revisions && item.revisions.length > 0) {
              item.revisions.forEach(rev => {
                hasTasks = true;
                const taskId = generateTaskId('REVISION', rev.subject, rev.topic);
                const mins = getMinutesForTask('REVISION');
                taskList.innerHTML += `
                  <div class="task-item" data-id="${taskId}" data-minutes="${mins}" data-task-type="REVISION">
                    <div class="task-left">
                      <div class="task-checkbox" title="Mark visually complete on dashboard"></div>
                      <div class="task-details">
                        <h4><a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" style="color: inherit; text-decoration: none;" title="Click to open Google Sheet">${rev.subject} 🔗</a></h4>
                        <p>${rev.topic}</p>
                      </div>
                    </div>
                    <div class="task-meta">
                      <span class="task-tag tag-history">Revision</span>
                      <a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" title="Update in Google Sheet" style="margin-left: 12px; text-decoration: none; font-size: 1.2rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">📝</a>
                    </div>
                  </div>
                `;
              });
            }
          } 
          // Handle everything else (CLASSES, Analysis, etc)
          else {
            hasTasks = true;
            let tagClass = 'tag-current';
            if (item.task.toLowerCase().includes('analysis') || item.task.toLowerCase().includes('test')) {
              tagClass = 'tag-writing';
            }
            
            const taskId = generateTaskId(item.task, item.subject, item.topic);
            const mins = getMinutesForTask(item.task);
            taskList.innerHTML += `
              <div class="task-item" data-id="${taskId}" data-minutes="${mins}" data-task-type="${item.task}">
                <div class="task-left">
                  <div class="task-checkbox" title="Mark visually complete on dashboard"></div>
                  <div class="task-details">
                    <h4><a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" style="color: inherit; text-decoration: none;" title="Click to open Google Sheet">${item.subject || 'Task'} 🔗</a></h4>
                    <p>${item.topic || ''}</p>
                  </div>
                </div>
                <div class="task-meta">
                  <span class="task-tag ${tagClass}">${item.task}</span>
                  <a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" title="Update in Google Sheet" style="margin-left: 12px; text-decoration: none; font-size: 1.2rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">📝</a>
                </div>
              </div>
            `;
          }
        });
        
        // NOW ADD PYQ TEST (derived from CLASSES)
        data.forEach(item => {
          if (item.task && item.task.startsWith('CLASSES')) {
            if (item.subject && !item.subject.includes('[')) {
              hasTasks = true;
              
              // Add PYQ TEST
              let taskId = generateTaskId('PYQ TEST', item.subject, item.topic);
              let mins = getMinutesForTask('PYQ TEST');
              taskList.innerHTML += `
                <div class="task-item" data-id="${taskId}" data-minutes="${mins}" data-task-type="PYQ TEST">
                  <div class="task-left">
                    <div class="task-checkbox" title="Mark visually complete on dashboard"></div>
                    <div class="task-details">
                      <h4><a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" style="color: inherit; text-decoration: none;" title="Click to open Google Sheet">${item.subject} 🔗</a></h4>
                      <p>${item.topic}</p>
                    </div>
                  </div>
                  <div class="task-meta">
                    <span class="task-tag tag-writing" style="background: #fef08a; color: #a16207;">PYQ TEST</span>
                    <a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" title="Update in Google Sheet" style="margin-left: 12px; text-decoration: none; font-size: 1.2rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">📝</a>
                  </div>
                </div>
              `;
              
              // Add ANALYSIS for this PYQ TEST
              taskId = generateTaskId('ANALYSIS', item.subject, item.topic);
              mins = getMinutesForTask('ANALYSIS');
              taskList.innerHTML += `
                <div class="task-item" data-id="${taskId}" data-minutes="${mins}" data-task-type="ANALYSIS">
                  <div class="task-left">
                    <div class="task-checkbox" title="Mark visually complete on dashboard"></div>
                    <div class="task-details">
                      <h4><a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" style="color: inherit; text-decoration: none;" title="Click to open Google Sheet">${item.subject} 🔗</a></h4>
                      <p>Analysis for PYQ Test</p>
                    </div>
                  </div>
                  <div class="task-meta">
                    <span class="task-tag tag-writing" style="background: #fecdd3; color: #be123c;">ANALYSIS</span>
                    <a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" title="Update in Google Sheet" style="margin-left: 12px; text-decoration: none; font-size: 1.2rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">📝</a>
                  </div>
                </div>
              `;
            }
          }
        });

        // NOW ADD MOCK TEST (derived from REVISION)
        data.forEach(item => {
          if (item.task === 'REVISION' && item.revisions) {
            item.revisions.forEach(rev => {
              if (rev.topic && !rev.topic.includes('Same Day Rev')) {
                hasTasks = true;
                const taskId = generateTaskId('MOCK TEST', rev.subject, rev.topic);
                const mins = getMinutesForTask('MOCK TEST');
                taskList.innerHTML += `
                  <div class="task-item" data-id="${taskId}" data-minutes="${mins}" data-task-type="MOCK TEST">
                    <div class="task-left">
                      <div class="task-checkbox" title="Mark visually complete on dashboard"></div>
                      <div class="task-details">
                        <h4><a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" style="color: inherit; text-decoration: none;" title="Click to open Google Sheet">${rev.subject} 🔗</a></h4>
                        <p>${rev.topic}</p>
                      </div>
                    </div>
                    <div class="task-meta">
                      <span class="task-tag" style="background: #f3e8ff; color: #7e22ce; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase;">MOCK TEST</span>
                      <a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" title="Update in Google Sheet" style="margin-left: 12px; text-decoration: none; font-size: 1.2rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">📝</a>
                    </div>
                  </div>
                `;
              }
            });
          }
        });
        
        if (!hasTasks) {
          taskList.innerHTML = '<p style="color: #64748b; padding: 16px; text-align: center;">No tasks assigned for today. Take a rest!</p>';
        }
        
        // Helper to update dashboard stats based on completed tasks
        function updateDashboardStats() {
          let totalMinutes = 0;
          let doneTasks = 0;
          const allItems = document.querySelectorAll('.task-item');
          const totalTasks = allItems.length;

          let breakdown = { 'CLASSES': 0, 'REVISION': 0, 'PYQ TEST': 0, 'MOCK TEST': 0, 'ANALYSIS': 0 };

          allItems.forEach(el => {
            if (el.classList.contains('completed')) {
              doneTasks++;
              const mins = parseInt(el.getAttribute('data-minutes') || '0', 10);
              totalMinutes += mins;
              
              const taskType = (el.getAttribute('data-task-type') || '').toUpperCase();
              let matchedType = Object.keys(breakdown).find(k => taskType.includes(k)) || 'CLASSES';
              breakdown[matchedType] += mins;
            }
          });

          // Save today's breakdown to localStorage for historical chart
          const todayStr = getISTDateStr();
          let stats = JSON.parse(localStorage.getItem('RONE_StudyStats') || '{}');
          stats[todayStr] = {
            totalMinutes: totalMinutes,
            breakdown: breakdown
          };
          localStorage.setItem('RONE_StudyStats', JSON.stringify(stats));
          
          // Re-render chart if it's visible or global refresh
          if (window.refreshStudyChart) window.refreshStudyChart();

          // Update Tasks Completed
          const statTasksEl = document.getElementById('stat-tasks-completed');
          if (statTasksEl) statTasksEl.textContent = `${doneTasks}/${totalTasks}`;

          // Update Study Time
          const hrs = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          let timeStr = '--';
          if (totalMinutes > 0) {
            if (hrs > 0 && mins > 0) timeStr = `${hrs}h ${mins}m`;
            else if (hrs > 0) timeStr = `${hrs}h`;
            else timeStr = `${mins}m`;
          }
          const studyTimeStat = document.getElementById('stat-study-time');
          if (studyTimeStat) studyTimeStat.textContent = timeStr;
        }
        
        // Add click event for checkboxes and restore state from localStorage
        document.querySelectorAll('.task-item').forEach(el => {
          const taskId = el.getAttribute('data-id');
          
          // Restore state
          if (taskId && localStorage.getItem(taskId) === 'true') {
            el.classList.add('completed');
            el.querySelector('.task-checkbox').innerHTML = '✓';
          }

          el.addEventListener('click', function(e) {
            // ONLY toggle if the explicit checkbox was clicked
            if (!e.target.classList.contains('task-checkbox')) return;
            
            this.classList.toggle('completed');
            const isCompleted = this.classList.contains('completed');
            
            const checkbox = this.querySelector('.task-checkbox');
            checkbox.innerHTML = isCompleted ? '✓' : '';
            
            // Save to localStorage
            if (taskId) {
              if (isCompleted) localStorage.setItem(taskId, 'true');
              else localStorage.removeItem(taskId);
            }

            // Update stats whenever checked/unchecked
            updateDashboardStats();
          });
        });

        // Initialize stats on load
        updateDashboardStats();

      } catch (err) {
        console.error(err);
        taskList.innerHTML = '<p style="color: #ef4444; padding: 16px; text-align: center;">Failed to load tasks. Please check the planner image.</p>';
      }
    }
async function fetchProgress() {
      const progressList = document.getElementById('syllabus-progress-list');
      if (!progressList) return;
      
      const timestamp = new Date().getTime();
      const jsonUrl = `https://raw.githubusercontent.com/RONESIRVI/RAS-Study-Planner/main/output/progress.json?v=${timestamp}`;
      
      try {
        const response = await fetch(jsonUrl);
        if (!response.ok) throw new Error("Failed to fetch progress JSON");
        
        const data = await response.json();
        progressList.innerHTML = ''; // Clear loading text
        
        let hasProgress = false;
        let overallCompleted = 0;
        let overallTotal = 0;
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899', '#14b8a6'];
        let colorIndex = 0;
        
        for (const [subject, stats] of Object.entries(data)) {
          if (stats.total > 0) {
            hasProgress = true;
            overallCompleted += stats.completed;
            overallTotal += stats.total;
            
            const percent = Math.round((stats.completed / stats.total) * 100);
            const color = colors[colorIndex % colors.length];
            colorIndex++;
            
            progressList.innerHTML += `
              <div class="progress-item">
                <div class="progress-header">
                  <span>${subject} <a href="https://docs.google.com/spreadsheets/d/1Zo81TfPcU09ErH7g-bj-4TksqceuBmiL/edit" target="_blank" title="Update ${subject} in Google Sheet" style="text-decoration: none; font-size: 0.9em; margin-left: 8px; transition: transform 0.2s; display: inline-block;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">📝</a></span>
                  <span>${percent}%</span>
                </div>
                <div class="progress-bar-bg">
                  <div class="progress-bar-fill" style="width: ${percent}%; background: ${color};"></div>
                </div>
              </div>
            `;
          }
        }
        
        if (!hasProgress) {
          progressList.innerHTML = '<p style="color: #64748b; text-align: center;">No progress data available.</p>';
        } else if (overallTotal > 0) {
          // Update Overall Progress Stat
          const overallPercent = Math.round((overallCompleted / overallTotal) * 100);
          const overallEl = document.getElementById('overall-progress-stat');
          if(overallEl) overallEl.textContent = `${overallPercent}%`;
        }

      } catch (err) {
        console.error(err);
        progressList.innerHTML = '<p style="color: #ef4444; text-align: center;">Failed to load progress data.</p>';
      }
    }
// GitHub Sync Logic
    const syncBtn = document.getElementById('syncDataBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        let token = localStorage.getItem('github_pat');
        
        if (!token) {
          token = prompt("Please enter your GitHub Personal Access Token (PAT) with 'repo' scope to sync data directly from GitHub Actions:\\n\\nIf you don't have one, generate it at https://github.com/settings/tokens");
          if (!token) return; // User cancelled
          localStorage.setItem('github_pat', token.trim());
        }

        // Confirm sync
        if (!confirm("This will trigger the backend script to fetch the latest Excel data. It takes about 1-2 minutes to complete. Do you want to continue?")) {
          return;
        }

        // Start Sync UI
        const syncIcon = document.getElementById('syncIcon');
        syncBtn.disabled = true;
        syncBtn.style.background = "#94a3b8";
        syncBtn.innerHTML = `<span id="syncIcon">⏳</span> Syncing...`;

        try {
          const response = await fetch("https://api.github.com/repos/RONESIRVI/RAS-Study-Planner/actions/workflows/daily_study.yml/dispatches", {
            method: "POST",
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "Authorization": `Bearer ${token.trim()}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              "ref": "main",
              "inputs": {
                "run_type": "plan"
              }
            })
          });

          if (response.ok || response.status === 204) {
            alert("✅ Sync started successfully!\\n\\nThe backend script is now pulling data from your Excel sheet.\\nPlease wait about 1-2 minutes and then refresh this page to see the updated Planner and Progress.");
          } else {
            const errData = await response.json();
            alert(`❌ Failed to start sync.
Error: ${errData.message || response.statusText}

Your Token might be invalid or expired. I've cleared it, please try clicking Sync again with a valid token.`);
            localStorage.removeItem('github_pat'); // Clear invalid token
          }
        } catch (err) {
          alert("❌ Network Error. Failed to trigger GitHub action.");
        } finally {
          // Reset button
          syncBtn.disabled = false;
          syncBtn.style.background = "#3b82f6";
          syncBtn.innerHTML = `<span id="syncIcon">🔄</span> Sync Data`;
        }
      });
    }


  // Study Time Chart Logic
  document.addEventListener('DOMContentLoaded', () => {
    const ctx = document.getElementById('studyTimeChart');
    if (!ctx) return;
    
    // Create gradient for the area chart
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.4)'); // blue-500 with opacity
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

    // Helper to format Date as YYYY-MM-DD
    const fDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    let studyChart = null;

    window.refreshStudyChart = function() {
      const stats = JSON.parse(localStorage.getItem('RONE_StudyStats') || '{}');
      const today = new Date();
      
      const getStat = (dateStr) => stats[dateStr] || { totalMinutes: 0, breakdown: {'CLASSES':0, 'REVISION':0, 'PYQ TEST':0, 'MOCK TEST':0, 'ANALYSIS':0} };
      const todayStr = fDate(today);

      // Daily: Today's breakdown
      const todayData = getStat(todayStr).breakdown;
      
      // Weekly: Last 7 days
      let weeklyLabels = [];
      let weeklyData = [];
      for(let i=6; i>=0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        weeklyLabels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
        weeklyData.push(parseFloat((getStat(fDate(d)).totalMinutes / 60).toFixed(1))); // In hours
      }

      // Monthly: Weeks of current month
      let monthlyLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      let monthlyData = [0, 0, 0, 0];
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for(let i=1; i<=daysInMonth; i++) {
        const dStr = fDate(new Date(today.getFullYear(), today.getMonth(), i));
        const hrs = getStat(dStr).totalMinutes / 60;
        if(i<=7) monthlyData[0] += hrs;
        else if(i<=14) monthlyData[1] += hrs;
        else if(i<=21) monthlyData[2] += hrs;
        else monthlyData[3] += hrs;
      }
      monthlyData = monthlyData.map(v => parseFloat(v.toFixed(1)));

      // Yearly: Months of the year
      let yearlyLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      let yearlyData = new Array(12).fill(0);
      Object.keys(stats).forEach(dateStr => {
        if(dateStr.startsWith(today.getFullYear().toString())) {
          const monthIndex = parseInt(dateStr.split('-')[1]) - 1;
          yearlyData[monthIndex] += stats[dateStr].totalMinutes / 60;
        }
      });
      yearlyData = yearlyData.map(v => parseFloat(v.toFixed(1)));

      const chartDataSets = {
        daily: {
          labels: ['Classes', 'Revision', 'PYQ Test', 'Mock Test', 'Analysis'],
          data: [todayData['CLASSES'], todayData['REVISION'], todayData['PYQ TEST'], todayData['MOCK TEST'], todayData['ANALYSIS']],
          unit: 'Minutes'
        },
        weekly: { labels: weeklyLabels, data: weeklyData, unit: 'Hours' },
        monthly: { labels: monthlyLabels, data: monthlyData, unit: 'Hours' },
        yearly: { labels: yearlyLabels, data: yearlyData, unit: 'Hours' }
      };

      const activeBtn = document.querySelector('.chart-filter.active');
      const activeRange = activeBtn ? activeBtn.getAttribute('data-range') : 'daily';
      const newData = chartDataSets[activeRange];

      if (studyChart) {
        studyChart.data.labels = newData.labels;
        studyChart.data.datasets[0].data = newData.data;
        studyChart.data.datasets[0].label = `Study Time (${newData.unit})`;
        studyChart.update();
      } else {
        studyChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: newData.labels,
            datasets: [{
              label: `Study Time (${newData.unit})`,
              data: newData.data,
              fill: true,
              backgroundColor: gradient,
              borderColor: '#3b82f6',
              borderWidth: 2,
              pointBackgroundColor: '#ffffff',
              pointBorderColor: '#3b82f6',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              tension: 0.4
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleColor: '#fff', bodyColor: '#e2e8f0', padding: 12, cornerRadius: 8, displayColors: false }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9', drawBorder: false }, ticks: { color: '#64748b' } },
              x: { grid: { display: false, drawBorder: false }, ticks: { color: '#64748b' } }
            }
          }
        });
      }
      
      window.latestChartDataSets = chartDataSets;
    };

    // Initial render
    window.refreshStudyChart();

    // Handle filter buttons
    const filterBtns = document.querySelectorAll('.chart-filter');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.style.background = 'transparent';
          b.style.color = '#64748b';
          b.style.boxShadow = 'none';
          b.style.fontWeight = '500';
        });
        
        this.classList.add('active');
        this.style.background = '#fff';
        this.style.color = '#0f172a';
        this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        this.style.fontWeight = '600';

        const range = this.getAttribute('data-range');
        if (window.latestChartDataSets && studyChart) {
          const newData = window.latestChartDataSets[range];
          studyChart.data.labels = newData.labels;
          studyChart.data.datasets[0].data = newData.data;
          studyChart.data.datasets[0].label = `Study Time (${newData.unit})`;
          studyChart.update();
        }
      });
    });

    // Global Click Animation for Cards
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.card, .stat-card, .glass-card');
      if (card) {
        card.classList.remove('card-clicked-glow');
        void card.offsetWidth; // trigger reflow
        card.classList.add('card-clicked-glow');
        setTimeout(() => card.classList.remove('card-clicked-glow'), 500);
      }
    });
  });
  // --- QUOTE BANK CMS LOGIC (Shifted from Admin) ---
  const toggleCmsBtn = document.getElementById('btn-toggle-cms');
  let cmsAutoLoaded = false; // Flag to prevent duplicate auto-load
  if(toggleCmsBtn) {
    toggleCmsBtn.addEventListener('click', () => {
      const configPanel = document.getElementById('aspirant-cms-config');
      if(configPanel.style.display === 'none') {
        configPanel.style.display = 'block';
        toggleCmsBtn.textContent = '⚙️ Hide Manage Sync';
        window.loadAssignedCMS();
        // Auto-load files from Ranker's Root initially if not already loaded
        if(!cmsAutoLoaded) {
          cmsAutoLoaded = true;
          cmsBreadcrumbs = [{ id: RANKERS_ROOT_ID, name: '🏠 Root' }];
          window.fetchCmsFolder(RANKERS_ROOT_ID);
        }
      } else {
        configPanel.style.display = 'none';
        toggleCmsBtn.textContent = '⚙️ Manage Quote Bank Sync';
        if (window.renderQuoteBankFiles) window.renderQuoteBankFiles();
      }
    });
  }

  let fetchedDriveFiles = [];
  let selectedFileForCMS = null;
  let cmsBreadcrumbs = [];
  const RANKERS_ROOT_ID = '15UinxbrX7EY4tcpiDuXUkiWT_VKEsc1d';
  const QUOTE_BANK_ROOT_ID = '18WYtoXeu-_GqC9C5elfvt3WHzh3MUigQ';

  window.loadAssignedCMS = function() {
    const stored = localStorage.getItem('quoteBankFiles');
    const assigned = stored ? JSON.parse(stored) : [];
    const listEl = document.getElementById('assigned-files-list');
    if(!listEl) return;
    listEl.innerHTML = '';

    listEl.style.display = 'grid';
    listEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(130px, 1fr))';
    listEl.style.gap = '15px';
    listEl.style.padding = '10px 0';

    if(assigned.length === 0) {
      listEl.style.display = 'block';
      listEl.innerHTML = '<p style="color:#64748b; font-size:0.9rem;">No files assigned yet.</p>';
      return;
    }
    
    assigned.forEach((f, idx) => {
      const item = document.createElement('div');
      item.style = `
        position: relative;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      `;
      
      item.onmouseover = () => { 
        item.style.transform = 'translateY(-4px)'; 
        item.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; 
        item.style.borderColor = '#cbd5e1';
      };
      
      item.onmouseout = () => { 
        item.style.transform = 'translateY(0)'; 
        item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; 
        item.style.borderColor = '#e2e8f0';
      };

      // Icon Wrapper
      const iconDiv = document.createElement('div');
      iconDiv.style = `
        font-size: 2.5rem;
        line-height: 1;
        margin-bottom: 10px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      `;
      iconDiv.innerHTML = '📄';

      // Name Wrapper
      const nameDiv = document.createElement('div');
      nameDiv.style = `
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-word;
        margin-bottom: 8px;
      `;
      nameDiv.title = f.name;
      nameDiv.textContent = f.name;
      
      // Category Label
      const catDiv = document.createElement('div');
      catDiv.style = `
        font-size: 0.7rem;
        color: #0f172a;
        background: #e2e8f0;
        padding: 2px 8px;
        border-radius: 10px;
        margin-bottom: 4px;
      `;
      catDiv.textContent = f.category;

      item.appendChild(iconDiv);
      item.appendChild(nameDiv);
      item.appendChild(catDiv);

      // Delete Button
      const delBtn = document.createElement('button');
      delBtn.innerHTML = '✕';
      delBtn.title = 'Remove Assignment';
      delBtn.style = `
        position: absolute;
        top: 6px;
        right: 6px;
        background: #fee2e2;
        color: #ef4444;
        border: none;
        border-radius: 50%;
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.6rem;
        font-weight: bold;
        transition: all 0.2s ease;
      `;
      delBtn.onmouseover = () => { delBtn.style.background = '#fecaca'; delBtn.style.transform = 'scale(1.1)'; };
      delBtn.onmouseout = () => { delBtn.style.background = '#fee2e2'; delBtn.style.transform = 'scale(1)'; };
      delBtn.onclick = () => window.removeCMSFile(idx);

      item.appendChild(delBtn);
      
      listEl.appendChild(item);
    });
  };

  window.removeCMSFile = function(idx) {
    const stored = localStorage.getItem('quoteBankFiles');
    if(stored) {
      let arr = JSON.parse(stored);
      arr.splice(idx, 1);
      localStorage.setItem('quoteBankFiles', JSON.stringify(arr));
      window.loadAssignedCMS();
    }
  };


  const syncBtnRankers = document.getElementById('btn-sync-rankers');
  if(syncBtnRankers) {
    syncBtnRankers.addEventListener('click', async () => {
      cmsBreadcrumbs = [{ id: RANKERS_ROOT_ID, name: "🏠 Ranker's Root" }];
      await window.fetchCmsFolder(RANKERS_ROOT_ID, syncBtnRankers);
    });
  }

  const syncBtnQuoteBank = document.getElementById('btn-sync-quotebank');
  if(syncBtnQuoteBank) {
    syncBtnQuoteBank.addEventListener('click', async () => {
      cmsBreadcrumbs = [{ id: QUOTE_BANK_ROOT_ID, name: "📚 Quote Bank Root" }];
      await window.fetchCmsFolder(QUOTE_BANK_ROOT_ID, syncBtnQuoteBank);
    });
  }

  window.fetchCmsFolder = async function(folderId, triggerBtn = null) {
    const GAS_URL = "https://script.google.com/macros/s/AKfycbx0Gg-U9MLuqE352oz9gfIYiYzqvQd3cmS6ndZ7pGd-giGHshi6I_OI1XQ_EaZ1XhHS/exec";
    
    let originalText = '';
    if(triggerBtn) {
      originalText = triggerBtn.textContent;
      triggerBtn.textContent = 'Loading...';
      triggerBtn.disabled = true;
    }
    
    try {
      const res = await fetch(`${GAS_URL}?folderId=${folderId}`);
      const data = await res.json();
      if(data.error) throw new Error(data.error);
      
      const items = Array.isArray(data) ? data : (data.data || []);
      fetchedDriveFiles = items.sort((a, b) => {
        const aFolder = a.type === 'folder';
        const bFolder = b.type === 'folder';
        if (aFolder && !bFolder) return -1;
        if (!aFolder && bFolder) return 1;
        return a.name.localeCompare(b.name);
      });
      document.getElementById('fetched-count').textContent = fetchedDriveFiles.length;
      
      renderCmsBreadcrumbs();
      renderFetchedFiles();
    } catch(err) {
      console.error(err);
      alert('Failed to fetch from Drive: ' + err.message);
    } finally {
      if(triggerBtn) {
        triggerBtn.textContent = originalText;
        triggerBtn.disabled = false;
      }
    }
  };

  function renderCmsBreadcrumbs() {
    const bcContainer = document.getElementById('cms-breadcrumb');
    if(!bcContainer) return;
    bcContainer.innerHTML = '';
    cmsBreadcrumbs.forEach((bc, idx) => {
      const btn = document.createElement('button');
      btn.style = 'background:none; border:none; color:#3b82f6; font-weight:600; cursor:pointer; font-size:0.85rem; padding:0;';
      if(idx === cmsBreadcrumbs.length - 1) {
        btn.style.color = '#1e293b';
        btn.style.cursor = 'default';
      }
      btn.innerHTML = bc.name;
      if(idx < cmsBreadcrumbs.length - 1) {
        btn.onclick = () => {
          cmsBreadcrumbs = cmsBreadcrumbs.slice(0, idx + 1);
          window.fetchCmsFolder(bc.id);
        };
      }
      bcContainer.appendChild(btn);
      
      if(idx < cmsBreadcrumbs.length - 1) {
        const sep = document.createElement('span');
        sep.textContent = '>';
        sep.style.color = '#94a3b8';
        sep.style.margin = '0 4px';
        bcContainer.appendChild(sep);
      }
    });
  }

  function renderFetchedFiles() {
    const listEl = document.getElementById('fetched-files-list');
    listEl.innerHTML = '';
    
    // Ensure grid display is applied if it was overridden
    listEl.style.display = 'grid';
    listEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(140px, 1fr))';
    listEl.style.gap = '15px';
    listEl.style.padding = '10px 0';

    if(fetchedDriveFiles.length === 0) {
      listEl.style.display = 'block'; // fallback for empty message
      listEl.innerHTML = '<p style="color:#64748b; font-size:0.9rem;">No files or folders found.</p>';
      return;
    }
    
    fetchedDriveFiles.forEach(f => {
      const isFolder = f.type === 'folder';
      const item = document.createElement('div');
      
      // Card Style
      item.style = `
        position: relative;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 16px 12px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      `;
      
      item.onmouseover = () => { 
        if(!selectedFileForCMS || selectedFileForCMS.id !== f.id) {
          item.style.transform = 'translateY(-4px)'; 
          item.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1)'; 
          item.style.borderColor = '#cbd5e1';
        }
      };
      
      item.onmouseout = () => { 
        if(!selectedFileForCMS || selectedFileForCMS.id !== f.id) {
          item.style.transform = 'translateY(0)'; 
          item.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; 
          item.style.borderColor = '#e2e8f0';
        }
      };

      if(selectedFileForCMS && selectedFileForCMS.id === f.id) {
        item.style.borderColor = '#3b82f6';
        item.style.background = '#eff6ff';
        item.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.3)';
        item.style.transform = 'translateY(-2px)';
      }

      // Icon Wrapper
      const iconDiv = document.createElement('div');
      iconDiv.style = `
        font-size: 3rem;
        line-height: 1;
        margin-bottom: 12px;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
      `;
      if (f.mimeType && f.mimeType.startsWith('image/')) {
        iconDiv.innerHTML = `<img src="https://drive.google.com/thumbnail?id=${f.id}&sz=w400" style="width:100%; height:80px; object-fit:cover; border-radius:8px;">`;
        iconDiv.style.width = '100%';
        iconDiv.style.fontSize = 'initial'; // reset
      } else {
        iconDiv.innerHTML = isFolder ? '📁' : '📄';
      }

      // Name Wrapper
      const nameDiv = document.createElement('div');
      nameDiv.style = `
        font-size: 0.85rem;
        font-weight: 600;
        color: #334155;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        word-break: break-word;
      `;
      nameDiv.title = f.name;
      nameDiv.textContent = f.name;
      
      item.appendChild(iconDiv);
      item.appendChild(nameDiv);

      if (isFolder) {
        item.onclick = () => {
          cmsBreadcrumbs.push({ id: f.id, name: f.name });
          window.fetchCmsFolder(f.id);
        };
      } else {
        item.onclick = (e) => {
          if(e.target.tagName.toLowerCase() === 'button') return;
          selectedFileForCMS = f;
          renderFetchedFiles(); // re-render to highlight selection
        };

        // Open Button for files (hover effect inside card)
        const openBtn = document.createElement('button');
        openBtn.innerHTML = '👁️';
        openBtn.title = 'Open Preview';
        openBtn.style = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(255,255,255,0.9);
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
        `;
        openBtn.onmouseover = (e) => { e.stopPropagation(); openBtn.style.background = '#f1f5f9'; openBtn.style.transform = 'scale(1.1)'; };
        openBtn.onmouseout = (e) => { e.stopPropagation(); openBtn.style.background = 'rgba(255,255,255,0.9)'; openBtn.style.transform = 'scale(1)'; };
        
        openBtn.onclick = (e) => {
          e.stopPropagation();
          let embedLink = `https://drive.google.com/file/d/${f.id}/preview`;
          
          let context = 'default';
          if(typeof QUOTE_BANK_ROOT_ID !== 'undefined' && cmsBreadcrumbs.length > 0 && cmsBreadcrumbs[0].id === QUOTE_BANK_ROOT_ID) {
            context = 'quote-bank';
          }
          
          if (typeof window.openPdfModal === 'function') {
            window.openPdfModal(f.name, embedLink, context, f.id);
          } else if (typeof openPdfModal === 'function') {
            openPdfModal(f.name, embedLink, context, f.id);
          }
        };
        item.appendChild(openBtn);
      }
      
      listEl.appendChild(item);
    });
  }

  // Old btn-cat-assign listeners removed; handled via event delegation in DOMContentLoaded

  const saveCmsBtn = document.getElementById('btn-save-cms');
  if(saveCmsBtn) {
    saveCmsBtn.addEventListener('click', () => {
      alert('Changes saved successfully! Hide this panel to see the updated Quote Bank.');
      if (window.renderQuoteBankFiles) window.renderQuoteBankFiles();
    });
  }
  

    const SNIPPET_GAS_URL = "https://script.google.com/macros/s/AKfycbyNWYSpGiJYadkmh0wxDqNUzixfA9DpAKNfEYABd_JsJvMxdZuGY-Uqsms-WOt6PIXq/exec";
    const SNIPPET_MAIN_FOLDER_ID = "18WYtoXeu-_GqC9C5elfvt3WHzh3MUigQ";
    
    // Screen Cutter JS Logic
    let cutterStream = null;
    let rawCaptureCanvas = null;
    let cropStartX = 0, cropStartY = 0, cropEndX = 0, cropEndY = 0;
    let isCutting = false;
    let finalBase64Image = null;

    async function startScreenCutter() {
      try {
        cutterStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { displaySurface: "browser" }, 
          preferCurrentTab: true,
          audio: false 
        });
        const video = document.createElement('video');
        video.srcObject = cutterStream;
        video.play();
        
        video.onloadedmetadata = () => {
          setTimeout(() => {
            rawCaptureCanvas = document.createElement('canvas');
            rawCaptureCanvas.width = video.videoWidth;
            rawCaptureCanvas.height = video.videoHeight;
            const ctx = rawCaptureCanvas.getContext('2d');
            ctx.drawImage(video, 0, 0, rawCaptureCanvas.width, rawCaptureCanvas.height);
            
            cutterStream.getTracks().forEach(track => track.stop());
            initCropUI();
          }, 300);
        };
      } catch(err) {
        console.error("Screen capture failed:", err);
        alert("Screen Share permission is required to use the Screen Cut tool.");
      }
    }

    function initCropUI() {
      const overlay = document.getElementById('screen-cutter-overlay');
      overlay.style.display = 'flex';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      
      const canvas = document.getElementById('cutter-canvas');
      // Set canvas resolution to native capture resolution
      canvas.width = rawCaptureCanvas.width;
      canvas.height = rawCaptureCanvas.height;
      
      // Scale using CSS to fit viewport while maintaining aspect ratio
      canvas.style.position = 'relative';
      canvas.style.maxWidth = '100vw';
      canvas.style.maxHeight = '100vh';
      canvas.style.width = 'auto';
      canvas.style.height = 'auto';
      canvas.style.objectFit = 'contain';
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(rawCaptureCanvas, 0, 0);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      let tempStartX = 0, tempStartY = 0;
      
      function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
          x: (e.clientX - rect.left) * scaleX,
          y: (e.clientY - rect.top) * scaleY
        };
      }
      
      canvas.onmousedown = (e) => {
        isCutting = true;
        const coords = getCanvasCoords(e);
        tempStartX = coords.x;
        tempStartY = coords.y;
        document.getElementById('btn-confirm-cut').style.display = 'none';
      };
      
      canvas.onmousemove = (e) => {
        if (!isCutting) return;
        const coords = getCanvasCoords(e);
        const curX = coords.x;
        const curY = coords.y;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(rawCaptureCanvas, 0, 0);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const rx = Math.min(tempStartX, curX);
        const ry = Math.min(tempStartY, curY);
        const rw = Math.abs(curX - tempStartX);
        const rh = Math.abs(curY - tempStartY);
        
        if (rw > 10 && rh > 10) {
          ctx.drawImage(rawCaptureCanvas, rx, ry, rw, rh, rx, ry, rw, rh);
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2 * (canvas.width / canvas.clientWidth);
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(rx, ry, rw, rh);
        }
      };
      
      canvas.onmouseup = (e) => {
        isCutting = false;
        const coords = getCanvasCoords(e);
        cropEndX = coords.x;
        cropEndY = coords.y;
        cropStartX = tempStartX;
        cropStartY = tempStartY;
        
        if (Math.abs(cropEndX - cropStartX) > 20 && Math.abs(cropEndY - cropStartY) > 20) {
          document.getElementById('btn-confirm-cut').style.display = 'inline-block';
        }
      };
    }

    function cancelScreenCutter() {
      document.getElementById('screen-cutter-overlay').style.display = 'none';
      document.getElementById('btn-confirm-cut').style.display = 'none';
    }

    function confirmScreenCut() {
      const rx = Math.min(cropStartX, cropEndX);
      const ry = Math.min(cropStartY, cropEndY);
      const rw = Math.abs(cropEndX - cropStartX);
      const rh = Math.abs(cropEndY - cropStartY);
      
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = rw;
      finalCanvas.height = rh;
      const finalCtx = finalCanvas.getContext('2d');
      finalCtx.drawImage(rawCaptureCanvas, rx, ry, rw, rh, 0, 0, rw, rh);
      
      finalBase64Image = finalCanvas.toDataURL('image/png');
      cancelScreenCutter();
      
      document.getElementById('cut-preview-img').src = finalBase64Image;
      fetchSnippetMetadata();
      document.getElementById('cut-category-modal').style.display = 'flex';
    }

    async function fetchSnippetMetadata() {
      try {
        const data = window.SNIPPET_CATEGORIES || {};
        
        // Populate Categories
        const categorySelect = document.getElementById('cut-category-select');
        categorySelect.innerHTML = '<option value="Uncategorized">Select Category...</option>';
        if(data.categories) {
          data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
          });
        }

        // Populate Ranks
        const rankSelect = document.getElementById('cut-rank-select');
        rankSelect.innerHTML = '<option value="">Select Rank / Name (Optional)</option>';
        if(data.ranks) {
          data.ranks.forEach(r => {
            const option = document.createElement('option');
            option.value = r;
            option.textContent = r;
            rankSelect.appendChild(option);
          });
        }

        // Populate Years
        const yearSelect = document.getElementById('cut-year-select');
        yearSelect.innerHTML = '<option value="">Select Year (Optional)</option>';
        if(data.years) {
          data.years.forEach(y => {
            const option = document.createElement('option');
            option.value = y;
            option.textContent = y;
            yearSelect.appendChild(option);
          });
        }

        // Populate Papers
        const paperSelect = document.getElementById('cut-paper-select');
        paperSelect.innerHTML = '<option value="">Select Paper (Optional)</option>';
        if(data.papers) {
          data.papers.forEach(p => {
            const option = document.createElement('option');
            option.value = p;
            option.textContent = p;
            paperSelect.appendChild(option);
          });
        }
      } catch(err) {
        console.error("Error loading categories:", err);
      }
    }

    function closeCutCategoryModal() {
      document.getElementById('cut-category-modal').style.display = 'none';
      finalBase64Image = null;
    }

    async function saveScreenCut() {
      const category = document.getElementById('cut-category-select').value;
      const rank = document.getElementById('cut-rank-select').value;
      const year = document.getElementById('cut-year-select').value;
      const paper = document.getElementById('cut-paper-select').value;
      
      if (!finalBase64Image) {
        alert('❌ No image to save! Please cut a screen area first.');
        return;
      }
      
      const saveBtn = document.getElementById('btn-save-cut');
      const cancelBtn = document.getElementById('btn-cancel-cut-save');
      const originalText = saveBtn.innerHTML;
      saveBtn.innerHTML = '⏳ Uploading to Drive...';
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      
      let imageUrl = null;
      
      if (SNIPPET_GAS_URL && SNIPPET_GAS_URL.includes('script.google.com')) {
        try {
          // 30 second timeout for GAS upload
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          
          const response = await fetch(SNIPPET_GAS_URL, {
            method: 'POST',
            signal: controller.signal,
            body: JSON.stringify({
              image: finalBase64Image,
              parentFolderId: SNIPPET_MAIN_FOLDER_ID,
              categoryName: category,
              rankName: rank,
              year: year,
              paper: paper,
              fileName: `Snippet_${Date.now()}.png`
            })
          });
          clearTimeout(timeoutId);
          
          const result = await response.json();
          if (result.success && result.previewUrl) {
            imageUrl = result.previewUrl;
            saveBtn.innerHTML = '✅ Saved!';
          } else {
            console.error("GAS Upload Failed:", result.error || result);
            saveBtn.innerHTML = '⚠️ Drive Failed - Saving Locally';
            imageUrl = finalBase64Image; // Fallback to local
          }
        } catch(err) {
          if (err.name === 'AbortError') {
            console.error("GAS Upload timed out after 30s");
            saveBtn.innerHTML = '⚠️ Timeout - Saving Locally';
          } else {
            console.error("Error connecting to GAS:", err);
            saveBtn.innerHTML = '⚠️ Error - Saving Locally';
          }
          imageUrl = finalBase64Image; // Fallback to local base64
        }
      } else {
        console.warn("GAS_URL not set. Saving snippet locally in localStorage.");
        imageUrl = finalBase64Image;
      }
      
      const snippet = {
        id: 'snip_' + Date.now(),
        image: imageUrl,
        category: category,
        rank: rank,
        year: year,
        paper: paper,
        timestamp: new Date().getTime(),
        pdfId: currentPdfId
      };
      
      let snippets = JSON.parse(localStorage.getItem('rone_ranker_snippets') || '[]');
      snippets.unshift(snippet);
      localStorage.setItem('rone_ranker_snippets', JSON.stringify(snippets));
      
      setTimeout(() => {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        cancelBtn.disabled = false;
        closeCutCategoryModal();
        renderRankerSnippets();
      }, 800);
    }

    function deleteSnippet(id) {
      if(!confirm('Are you sure you want to delete this snippet?')) return;
      let snippets = JSON.parse(localStorage.getItem('rone_ranker_snippets') || '[]');
      snippets = snippets.filter(s => s.id !== id);
      localStorage.setItem('rone_ranker_snippets', JSON.stringify(snippets));
      renderRankerSnippets();
    }

    function renderRankerSnippets() {
      const container = document.getElementById('rankers-snippets-container');
      if(!container) return;
      
      let allSnippets = JSON.parse(localStorage.getItem('rone_ranker_snippets') || '[]');
      let snippets = allSnippets.filter(s => s.pdfId === currentPdfId);
      
      if (snippets.length === 0) {
        container.innerHTML = `
          <div style="text-align:center;color:#64748b;padding:30px 0;margin:auto;">
            <div style="font-size:3rem;margin-bottom:15px;opacity:0.5;">✂️</div>
            <h4 style="margin:0 0 5px; color:#475569;">No Snippets Yet</h4>
            <p style="font-size:0.9rem;">Use the Screen Cut Tool to capture insights!</p>
          </div>
        `;
        return;
      }
      
      let html = '';
      snippets.forEach(snip => {
        let badgeColor = '#3b82f6';
        let badgeBg = '#dbeafe';
        if(snip.category.includes('Intro')) { badgeColor = '#10b981'; badgeBg = '#d1fae5'; }
        if(snip.category.includes('Body')) { badgeColor = '#8b5cf6'; badgeBg = '#ede9fe'; }
        if(snip.category.includes('Conclusion')) { badgeColor = '#f59e0b'; badgeBg = '#fef3c7'; }
        if(snip.category.includes('Improvement')) { badgeColor = '#ef4444'; badgeBg = '#fee2e2'; }
        
        html += `
          <div style="background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); border:1px solid #e2e8f0; position:relative;">
            <button onclick="deleteSnippet('${snip.id}')" style="position:absolute; top:8px; right:8px; background:white; color:#ef4444; border:none; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.1);">✕</button>
            <div style="padding:10px 15px; border-bottom:1px solid #e2e8f0; display:flex; justify-content:space-between; align-items:center; margin-right:30px;">
              <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:700;">${snip.category}</span>
              <span style="font-size:0.7rem; color:#94a3b8;">${new Date(snip.timestamp).toLocaleDateString()}</span>
            </div>
            <div style="padding:15px; text-align:center; background:#f8fafc;">
              <a href="${snip.image}" target="_blank">
                <img src="${snip.image.includes('drive.google.com') ? snip.image.replace('/preview', '').replace('file/d/', 'uc?id=') : snip.image}" style="max-width:100%; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.05); cursor:zoom-in;" onerror="this.src='https://via.placeholder.com/400x200?text=Image+Not+Found'">
              </a>
            </div>
          </div>
        `;
      });
      container.innerHTML = html;
    }
  