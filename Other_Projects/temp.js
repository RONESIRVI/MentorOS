
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  // ── State ─────────────────────────────────────────────────────────
  // pdfQueue: Array of { id, name, source, pdfDoc, totalPages, selectedPages: Set }
  let pdfQueue    = [];
  let activePdfId = null;
  let nextId      = 1;

  // ── DOM ──────────────────────────────────────────────────────────
  const dropZone        = document.getElementById('drop-zone');
  const fileInput       = document.getElementById('file-input');
  const btnBrowse       = document.getElementById('btn-browse');
  const btnAddMore      = document.getElementById('btn-add-more');
  const gdriveInput     = document.getElementById('gdrive-input');
  const btnGdriveLoad   = document.getElementById('btn-gdrive-load');
  const gdriveLoading   = document.getElementById('gdrive-loading');
  const gdriveLoadingTxt= document.getElementById('gdrive-loading-text');
  const queueSection    = document.getElementById('queue-section');
  const queueScroll     = document.getElementById('queue-scroll');
  const pagesSection    = document.getElementById('pages-section');
  const pagesSectionTitle = document.getElementById('pages-section-title');
  const pageGrid        = document.getElementById('page-grid');
  const pageCountBadge  = document.getElementById('page-count-badge');
  const selectedLabel   = document.getElementById('selected-label');
  const btnSelectAll    = document.getElementById('btn-select-all');
  const btnDeselectAll  = document.getElementById('btn-deselect-all');
  const dpiSlider       = document.getElementById('dpi-slider');
  const dpiValue        = document.getElementById('dpi-value');
  const qualitySlider   = document.getElementById('quality-slider');
  const qualityValue    = document.getElementById('quality-value');
  const progressSection = document.getElementById('progress-section');
  const progressBar     = document.getElementById('progress-bar');
  const progressPct     = document.getElementById('progress-pct');
  const progressLabel   = document.getElementById('progress-label');
  const progressLog     = document.getElementById('progress-log');
  const actionBar       = document.getElementById('action-bar');
  const actionTitle     = document.getElementById('action-title');
  const actionSubtitle  = document.getElementById('action-subtitle');
  const btnConvert      = document.getElementById('btn-convert');
  const btnZip          = document.getElementById('btn-download-zip');
  const btnDownloadAll  = document.getElementById('btn-download-all');
  const portalSection   = document.getElementById('portal-section');
  const portalGrid      = document.getElementById('portal-grid');
  
  let convertedImages   = []; // To store the converted images
  const toastContainer  = document.getElementById('toast-container');

  // ── Toast ─────────────────────────────────────────────────────────
  function showToast(msg, type = 'info', dur = 3500) {
    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<div class="toast-icon">${icons[type]}</div><span>${msg}</span>`;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-out');
      el.addEventListener('animationend', () => el.remove());
    }, dur);
  }

  // ── Slider labels ─────────────────────────────────────────────────
  dpiSlider.addEventListener('input', () => {
    const v = parseInt(dpiSlider.value);
    let label = '';
    if (v <= 96)       label = ' (Screen)';
    else if (v <= 200) label = ' (Standard)';
    else if (v <= 400) label = ' (Print)';
    else if (v <= 700) label = ' (High)';
    else               label = ' (Ultra)';
    dpiValue.textContent = v + ' DPI' + label;
  });
  qualitySlider.addEventListener('input', () => qualityValue.textContent = qualitySlider.value + '%');

  // ── Drag & Drop ───────────────────────────────────────────────────
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  ['dragleave','dragend'].forEach(ev => dropZone.addEventListener(ev, () => dropZone.classList.remove('drag-over')));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    const files = [...e.dataTransfer.files].filter(f => f.type === 'application/pdf');
    if (!files.length) { showToast('Please drop PDF files only.', 'error'); return; }
    files.forEach(f => queueLocalFile(f));
  });
  dropZone.addEventListener('click', e => { if (!btnBrowse.contains(e.target)) fileInput.click(); });
  btnBrowse.addEventListener('click', () => fileInput.click());
  btnAddMore.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    [...fileInput.files].forEach(f => queueLocalFile(f));
    fileInput.value = '';
  });

  // ── Google Drive ──────────────────────────────────────────────────
  function extractGDriveId(url) {
    // Formats: /file/d/ID/view  OR  ?id=ID  OR  /d/ID
    const m1 = url.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    return (m1 && m1[1]) || (m2 && m2[1]) || null;
  }

  btnGdriveLoad.addEventListener('click', () => loadGDriveLink(gdriveInput.value.trim()));
  gdriveInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadGDriveLink(gdriveInput.value.trim()); });

  async function loadGDriveLink(url) {
    if (!url) { showToast('Please paste a Google Drive link first.', 'warning'); return; }
    const fileId = extractGDriveId(url);
    if (!fileId) { showToast('Could not find a valid Google Drive file ID in that URL.', 'error'); return; }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const proxyUrl    = `https://corsproxy.io/?${encodeURIComponent(downloadUrl)}`;

    gdriveLoading.classList.add('show');
    gdriveLoadingTxt.textContent = 'Connecting to Google Drive…';
    btnGdriveLoad.disabled = true;

    try {
      gdriveLoadingTxt.textContent = 'Downloading PDF…';
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentType = response.headers.get('content-type') || '';
      // Google sometimes returns HTML for large-file confirmation
      if (contentType.includes('text/html')) {
        throw new Error('large_file');
      }

      gdriveLoadingTxt.textContent = 'Parsing PDF…';
      const arrayBuffer = await response.arrayBuffer();

      // Validate it's a PDF
      const header = new Uint8Array(arrayBuffer.slice(0, 4));
      const isPdf  = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
      if (!isPdf) throw new Error('not_pdf');

      const name = `gdrive_${fileId.slice(0, 8)}`;
      await queueArrayBuffer(arrayBuffer, name, 'gdrive');
      gdriveInput.value = '';
      showToast('Google Drive PDF loaded!', 'success');
    } catch (err) {
      console.error(err);
      if (err.message === 'large_file') {
        showToast('File too large for direct download — Google needs confirmation. Try downloading manually and uploading here.', 'error', 7000);
      } else if (err.message === 'not_pdf') {
        showToast('The link did not return a PDF. Make sure sharing is set to "Anyone with the link".', 'error', 5000);
      } else {
        showToast('Could not fetch the file. Ensure it is publicly shared and try again.', 'error', 5000);
      }
    } finally {
      gdriveLoading.classList.remove('show');
      btnGdriveLoad.disabled = false;
    }
  }

  // ── Queue helpers ─────────────────────────────────────────────────
  async function queueLocalFile(file) {
    const name = file.name.replace(/\.pdf$/i, '');

    // 1. MIME type check
    if (file.type && !file.type.includes('pdf')) {
      if (file.type.startsWith('image/')) {
        showToast(`"${file.name}" ek IMAGE file hai, PDF nahi! Sirf PDF upload karen.`, 'error', 6000);
      } else {
        showToast(`"${file.name}" PDF nahi hai (Type: ${file.type}).`, 'error', 6000);
      }
      return;
    }

    // 2. Extension check
    const ext = file.name.split('.').pop().toLowerCase();
    const imageExts = ['jpg','jpeg','png','heic','heif','gif','bmp','webp','tiff','tif','svg'];
    if (imageExts.includes(ext)) {
      showToast(`"${file.name}" ek image file hai (.${ext.toUpperCase()}). PDF chahiye!`, 'error', 6000);
      return;
    }

    // 3. Magic bytes check (%PDF header)
    const buf = await file.arrayBuffer();
    const magic = new Uint8Array(buf.slice(0, 5));
    const isPdf = magic[0] === 0x25 && magic[1] === 0x50 && magic[2] === 0x44 && magic[3] === 0x46;
    if (!isPdf) {
      const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8;
      const isPng  = magic[0] === 0x89 && magic[1] === 0x50;
      if (isJpeg || isPng) {
        showToast(`"${file.name}" ek image file hai. Sirf PDF upload karen.`, 'error', 6000);
      } else {
        showToast(`"${file.name}" valid PDF nahi hai (wrong file type).`, 'error', 6000);
      }
      return;
    }

    await queueArrayBuffer(buf, name, 'local');
  }

  async function queueArrayBuffer(arrayBuffer, name, source) {
    const showErr = (msg, dur) => showToast(msg, 'error', dur || 10000);
    let pdfDoc = null;

    // Attempt 1: Strict
    try {
      pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
    } catch (e1) {
      console.error('[PDF strict]', e1.name, e1.message);
      if (e1.name === 'PasswordException') {
        showErr(`🔒 "${name}" password-protected hai!\nTip: ilovepdf.com se password hatao.`, 12000);
        return;
      }

      // Attempt 2: Lenient
      try {
        pdfDoc = await pdfjsLib.getDocument({
          data: arrayBuffer.slice(0),
          stopAtErrors: false,
          isEvalSupported: false
        }).promise;
        showToast(`⚠️ "${name}" load hua (minor issues ke saath).`, 'warning', 5000);
      } catch (e2) {
        console.error('[PDF lenient]', e2.name, e2.message);

        // Attempt 3: Maximum compatibility
        try {
          pdfDoc = await pdfjsLib.getDocument({
            data: arrayBuffer.slice(0),
            stopAtErrors: false,
            isEvalSupported: false,
            disableRange: true,
            disableStream: true,
            disableAutoFetch: true
          }).promise;
          showToast(`⚠️ "${name}" compatibility mode mein load hua.`, 'warning', 5000);
        } catch (e3) {
          console.error('[PDF max-compat]', e3.name, e3.message);
          const n   = (e3.name    || '').toLowerCase();
          const msg = (e3.message || '').toLowerCase();
          if (n.includes('password') || msg.includes('password')) {
            showErr(`🔒 "${name}" password-protected hai! ilovepdf.com se password hatao.`, 12000);
          } else if (n === 'invalidpdfexception' || msg.includes('invalid pdf') || msg.includes('not a pdf')) {
            showErr(`❌ "${name}" valid PDF nahi hai. File rename ki gayi ho sakti hai.`, 10000);
          } else if (msg.includes('xfa') || msg.includes('acroform')) {
            showErr(`❌ "${name}" XFA form hai. Adobe Acrobat mein "Print to PDF" karo.`, 10000);
          } else {
            const raw = `${e3.name || ''}: ${e3.message || 'Unknown error'}`;
            showErr(`❌ "${name}" load nahi hua.\n🔍 ${raw}\n(Yeh copy karke batao)`, 15000);
          }
          return;
        }
      }
    }

    // Success
    const totalPages = pdfDoc.numPages;
    const id = nextId++;
    const entry = { id, name, source, pdfDoc, totalPages, selectedPages: new Set() };
    for (let i = 1; i <= totalPages; i++) entry.selectedPages.add(i);
    pdfQueue.push(entry);
    renderQueueTabs();
    setActivePdf(id);
    showUI();
    showToast(`✅ "${name}" load hua — ${totalPages} page${totalPages !== 1 ? 's' : ''}`, 'success', 3000);
  }

  function removePdf(id) {
    pdfQueue = pdfQueue.filter(p => p.id !== id);
    if (!pdfQueue.length) {
      hideUI(); return;
    }
    if (activePdfId === id) setActivePdf(pdfQueue[pdfQueue.length - 1].id);
    else renderQueueTabs();
  }

  function getActive() { return pdfQueue.find(p => p.id === activePdfId); }

  // ── Queue Cards ───────────────────────────────────────────────────
  function renderQueueTabs() {
    queueScroll.querySelectorAll('.pdf-tab').forEach(t => t.remove());

    pdfQueue.forEach((p, idx) => {
      const tab = document.createElement('div');
      tab.className = `pdf-tab${p.id === activePdfId ? ' active' : ''}`;
      tab.dataset.id = p.id;
      tab.style.animationDelay = `${idx * 60}ms`;

      const gdriveIcon = `<svg viewBox="0 0 87.3 78" width="22" height="22"><path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/><path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 0 0 0 53h27.5z" fill="#00ac47"/><path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75L86.1 57.5c.8-1.4 1.2-2.95 1.2-4.5H59.8z" fill="#ea4335"/><path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/><path d="M73.4 26.5l-13.25-23c-.8-1.4-1.95-2.5-3.3-3.3L43.6 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/></svg>`;
      const localIcon  = `<svg viewBox="0 0 24 24" fill="white" width="20" height="20"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8L14 2zm-1 1.5L18.5 9H13V3.5zM6 4h5v7h7v9H6V4z"/></svg>`;

      tab.innerHTML = `
        <div class="pdf-tab-header">
          <div class="pdf-tab-icon ${p.source}">
            ${p.source === 'gdrive' ? gdriveIcon : localIcon}
          </div>
          <button class="pdf-tab-remove" data-remove="${p.id}" title="Remove PDF">✕</button>
        </div>
        <div class="pdf-tab-body">
          <div class="pdf-tab-info">
            <span class="pdf-tab-name" title="${p.name}">${p.name}</span>
            <span class="pdf-tab-pages">${p.totalPages} page${p.totalPages !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="pdf-tab-footer">
          <span class="pdf-tab-badge">${p.selectedPages.size} selected</span>
          <span class="pdf-tab-source-label">
            ${p.source === 'gdrive'
              ? `<svg viewBox="0 0 24 24" fill="#34a853" width="10" height="10"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> Drive`
              : `<svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg> Local`
            }
          </span>
        </div>
      `;
      tab.addEventListener('click', e => {
        if (e.target.closest('.pdf-tab-remove')) {
          removePdf(parseInt(e.target.closest('.pdf-tab-remove').dataset.remove));
          return;
        }
        setActivePdf(p.id);
      });
      queueScroll.insertBefore(tab, btnAddMore);
    });
  }

  // ── Set active PDF & render pages ────────────────────────────────
  function setActivePdf(id) {
    activePdfId = id;
    renderQueueTabs();
    renderPages();
  }

  async function renderPages() {
    const entry = getActive();
    if (!entry) return;

    pagesSectionTitle.textContent = `Pages — ${entry.name}`;
    pageCountBadge.textContent = `${entry.totalPages} page${entry.totalPages !== 1 ? 's' : ''}`;
    pageGrid.innerHTML = '';

    for (let i = 1; i <= entry.totalPages; i++) {
      const isSelected = entry.selectedPages.has(i);
      const card = document.createElement('div');
      card.className = `page-card${isSelected ? ' selected' : ''}`;
      card.dataset.page = i;
      card.style.animationDelay = `${(i - 1) * 35}ms`;
      card.innerHTML = `
        <div class="thumb-skeleton" id="sk-${entry.id}-${i}"></div>
        <div class="page-overlay">
          <div class="page-checkbox">
            <svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
          </div>
          <span class="page-num">Page ${i}</span>
        </div>
        <div class="page-footer">
          <span class="page-label">Page ${i}</span>
          <button class="btn-dl-single" data-page="${i}" title="Download this page">
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            JPG
          </button>
        </div>
      `;
      card.addEventListener('click', e => {
        if (e.target.closest('.btn-dl-single')) return;
        togglePage(entry, i, card);
      });
      card.querySelector('.btn-dl-single').addEventListener('click', e => {
        e.stopPropagation();
        downloadSinglePage(entry, parseInt(e.currentTarget.dataset.page));
      });
      pageGrid.appendChild(card);
    }

    updateSelectionUI();

    // Render low-res thumbnails progressively
    for (let i = 1; i <= entry.totalPages; i++) {
      const sk = document.getElementById(`sk-${entry.id}-${i}`);
      if (!sk) continue; // user may have switched PDF
      try {
        const page     = await entry.pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas   = document.createElement('canvas');
        canvas.width   = viewport.width; canvas.height = viewport.height;
        canvas.className = 'page-thumbnail';
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        const curSk = document.getElementById(`sk-${entry.id}-${i}`);
        if (curSk) curSk.replaceWith(canvas);
      } catch (_) {}
    }
  }

  // ── Page toggle ───────────────────────────────────────────────────
  function togglePage(entry, num, card) {
    if (entry.selectedPages.has(num)) { entry.selectedPages.delete(num); card.classList.remove('selected'); }
    else { entry.selectedPages.add(num); card.classList.add('selected'); }
    updateSelectionUI();
    renderQueueTabs(); // update badge count
  }

  function selectAllPages() {
    const e = getActive(); if (!e) return;
    for (let i = 1; i <= e.totalPages; i++) e.selectedPages.add(i);
    document.querySelectorAll('.page-card').forEach(c => c.classList.add('selected'));
    updateSelectionUI(); renderQueueTabs();
  }
  function deselectAllPages() {
    const e = getActive(); if (!e) return;
    e.selectedPages.clear();
    document.querySelectorAll('.page-card').forEach(c => c.classList.remove('selected'));
    updateSelectionUI(); renderQueueTabs();
  }
  btnSelectAll.addEventListener('click',   selectAllPages);
  btnDeselectAll.addEventListener('click', deselectAllPages);

  function updateSelectionUI() {
    const e = getActive();
    const n = e ? e.selectedPages.size : 0;
    selectedLabel.textContent  = `${n} selected`;
    actionTitle.textContent    = n === 0 ? 'No pages selected' : `${n} page${n !== 1 ? 's' : ''} selected`;
    actionSubtitle.textContent = n === 0
      ? 'Select at least one page to convert'
      : `DPI: ${dpiSlider.value} · Quality: ${qualitySlider.value}% · PDF: ${e?.name}`;
    btnConvert.disabled  = n === 0;
    // reset UI to pre-conversion state if selection changes
    btnConvert.style.display = 'inline-flex';
    btnZip.style.display = 'none';
    btnDownloadAll.style.display = 'none';
    portalSection.style.display = 'none';
    portalGrid.innerHTML = '';
    convertedImages = [];
  }

  // ── Show / hide UI ────────────────────────────────────────────────
  function showUI() {
    queueSection.classList.add('visible');
    pagesSection.classList.add('visible');
    actionBar.classList.add('visible');
  }
  function hideUI() {
    queueSection.classList.remove('visible');
    pagesSection.classList.remove('visible');
    actionBar.classList.remove('visible');
    progressSection.classList.remove('visible');
    portalSection.style.display = 'none';
    portalGrid.innerHTML = '';
    convertedImages = [];
    pageGrid.innerHTML = '';
    activePdfId = null;
    renderQueueTabs();
  }

  // ── Render page at full quality ────────────────────────────────────
  async function renderPageToDataURL(pdfDoc, pageNum, dpi, quality) {
    const page     = await pdfDoc.getPage(pageNum);
    const scale    = dpi / 72;
    const viewport = page.getViewport({ scale });
    const canvas   = document.createElement('canvas');
    canvas.width   = Math.floor(viewport.width);
    canvas.height  = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;
    return canvas.toDataURL('image/jpeg', quality / 100);
  }

  // ── Convert active PDF to Images ──────────────────────────────────
  btnConvert.addEventListener('click', async () => {
    const entry = getActive(); if (!entry || entry.selectedPages.size === 0) return;
    await convertToImages([entry], false);
  });

  // ── Download Actions ──────────────────────────────────────────────
  btnZip.addEventListener('click', async () => {
    if (!convertedImages.length) return;
    await downloadConvertedZip();
  });

  btnDownloadAll.addEventListener('click', async () => {
    if (!convertedImages.length) return;
    await downloadConvertedJpgs();
  });

  async function convertToImages(entries) {
    const dpi     = parseInt(dpiSlider.value);
    const quality = parseInt(qualitySlider.value);
    const totalOps = entries.reduce((s, e) => s + e.selectedPages.size, 0);

    progressSection.classList.add('visible');
    progressBar.style.width = '0%'; progressPct.textContent = '0%';
    progressLabel.textContent = 'Converting pages…';
    btnConvert.disabled = true;

    convertedImages = [];
    portalGrid.innerHTML = '';
    let doneOps = 0;

    for (const entry of entries) {
      const pages = [...entry.selectedPages].sort((a, b) => a - b);
      
      for (const num of pages) {
        progressLog.textContent = `Rendering page ${num}/${entry.totalPages}…`;
        const dataURL = await renderPageToDataURL(entry.pdfDoc, num, dpi, quality);
        const fname   = `${entry.name}_page${String(num).padStart(3,'0')}.jpg`;

        convertedImages.push({ dataURL, fname });
        
        // Add to portal preview
        const imgCard = document.createElement('div');
        imgCard.className = 'page-card';
        imgCard.style.padding = '8px';
        imgCard.style.background = 'rgba(255,255,255,0.05)';
        imgCard.innerHTML = `
          <img src="${dataURL}" style="width: 100%; border-radius: 4px; display: block;" />
          <div style="font-size: 10px; text-align: center; margin-top: 8px; color: var(--text-secondary); word-break: break-all;">${fname}</div>
        `;
        portalGrid.appendChild(imgCard);

        doneOps++;
        const pct = Math.round((doneOps / totalOps) * 100);
        progressBar.style.width = pct + '%'; progressPct.textContent = pct + '%';
        
        await sleep(10); // yield for UI update
      }
    }

    progressLabel.textContent = 'Done!';
    progressLog.textContent   = `${doneOps} image${doneOps !== 1 ? 's' : ''} converted.`;
    
    // Switch action bar state
    btnConvert.style.display = 'none';
    btnZip.style.display = 'inline-flex';
    btnDownloadAll.style.display = 'inline-flex';
    btnZip.disabled = false;
    btnDownloadAll.disabled = false;
    
    portalSection.style.display = 'block';
    
    showToast(`${doneOps} JPG${doneOps !== 1 ? 's' : ''} converted and loaded on Portal!`, 'success');
    setTimeout(() => progressSection.classList.remove('visible'), 4000);
  }

  async function downloadConvertedZip() {
    progressSection.classList.add('visible');
    progressLabel.textContent = 'Building ZIP…';
    progressBar.style.width = '100%'; progressPct.textContent = '100%';
    btnZip.disabled = true;
    btnDownloadAll.disabled = true;

    const zip = new JSZip();
    for (const img of convertedImages) {
      const base64 = img.dataURL.split(',')[1];
      zip.file(img.fname, base64, { base64: true });
    }
    
    progressLog.textContent = 'Compressing ZIP…';
    const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
    saveAs(blob, `Converted_Images_${new Date().toISOString().slice(0, 10)}.zip`);
    
    btnZip.disabled = false;
    btnDownloadAll.disabled = false;
    setTimeout(() => progressSection.classList.remove('visible'), 2000);
  }

  async function downloadConvertedJpgs() {
    for (const img of convertedImages) {
      downloadDataURL(img.dataURL, img.fname);
      await sleep(100);
    }
  }

  // ── Single-page download ──────────────────────────────────────────
  async function downloadSinglePage(entry, num) {
    const dpi     = parseInt(dpiSlider.value);
    const quality = parseInt(qualitySlider.value);
    showToast(`Rendering page ${num}…`, 'info', 1500);
    const dataURL = await renderPageToDataURL(entry.pdfDoc, num, dpi, quality);
    downloadDataURL(dataURL, `${entry.name}_page${String(num).padStart(3,'0')}.jpg`);
    showToast(`Page ${num} downloaded!`, 'success');
  }

  // ── Helpers ───────────────────────────────────────────────────────
  function downloadDataURL(dataURL, filename) {
    const a = document.createElement('a');
    a.href = dataURL; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

