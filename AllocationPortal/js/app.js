/* ═══════════════════════════════════════════════
   app.js — RONE MentorOS
   Main controller: tabs, modals, events
═══════════════════════════════════════════════ */

const RoneApp = (() => {

  // ── Toast ──────────────────────────────────
  let toastTimer;
  function toast(msg, duration = 3000) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  }

  // ── Tab switching ──────────────────────────
  function initTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const panelId = `panel-${tab.dataset.tab}`;
        document.getElementById(panelId).classList.add('active');

        // Refresh whichever panel was opened
        if (tab.dataset.tab === 'students')   RoneRender.renderStudents();
        if (tab.dataset.tab === 'mentors')    RoneRender.renderMentors();
        if (tab.dataset.tab === 'allocation') RoneRender.renderAllocation();
      });
    });
  }

  // ── Search inputs ──────────────────────────
  function initSearch() {
    let sTimer, mTimer;

    document.getElementById('search-students').addEventListener('input', e => {
      clearTimeout(sTimer);
      sTimer = setTimeout(() => RoneRender.renderStudents(e.target.value), 200);
    });

    document.getElementById('search-mentors').addEventListener('input', e => {
      clearTimeout(mTimer);
      mTimer = setTimeout(() => RoneRender.renderMentors(e.target.value), 200);
    });
  }

  // ── Add New Modal ──────────────────────────
  function initModal() {
    const modal     = document.getElementById('modal-add');
    const openBtn   = document.getElementById('btn-add-new');
    const closeBtn  = document.getElementById('modal-close');

    openBtn.addEventListener('click', () => {
      modal.hidden = false;
    });
    closeBtn.addEventListener('click', () => {
      modal.hidden = true;
    });
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.hidden = true;
    });

    // Modal tabs
    document.querySelectorAll('.modal-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.modal-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`form-${tab.dataset.modalTab}`).classList.add('active');
      });
    });

    // Save student
    document.getElementById('save-student').addEventListener('click', () => {
      const name = document.getElementById('s-name').value.trim();
      if (!name) { toast('नाम जरूरी है!'); return; }

      RoneData.addStudent({
        name,
        class:   document.getElementById('s-class').value,
        stream:  document.getElementById('s-stream').value,
        subject: document.getElementById('s-subject').value,
        goal:    document.getElementById('s-goal').value,
        city:    document.getElementById('s-city').value,
        email:   document.getElementById('s-email').value,
      });

      modal.hidden = true;
      clearStudentForm();
      RoneRender.refreshAll();
      toast(`✓ ${name} को स्टुडेंट के रूप में जोड़ा गया`);

      // Switch to students tab
      document.querySelector('[data-tab="students"]').click();
    });

    // Save mentor
    document.getElementById('save-mentor').addEventListener('click', () => {
      const name = document.getElementById('m-name').value.trim();
      if (!name) { toast('नाम जरूरी है!'); return; }

      RoneData.addMentor({
        name,
        specialisation: document.getElementById('m-spec').value,
        institution:    document.getElementById('m-inst').value,
        capacity:       document.getElementById('m-cap').value,
        email:          document.getElementById('m-email').value,
      });

      modal.hidden = true;
      clearMentorForm();
      RoneRender.refreshAll();
      toast(`✓ ${name} को मेंटर के रूप में जोड़ा गया`);

      document.querySelector('[data-tab="mentors"]').click();
    });
  }

  function clearStudentForm() {
    ['s-name','s-subject','s-city','s-email'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }
  function clearMentorForm() {
    ['m-name','m-inst','m-email'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('m-cap').value = 8;
  }

  // ── Upload CSV ─────────────────────────────
  function initUpload() {
    setupDropZone('drop-students', 'file-students', 'students');
    setupDropZone('drop-mentors',  'file-mentors',  'mentors');

    // Header upload button → go to upload tab
    document.getElementById('btn-upload-csv').addEventListener('click', () => {
      document.querySelector('[data-tab="upload"]').click();
    });
  }

  function setupDropZone(zoneId, fileId, type) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(fileId);

    // Click to open file dialog
    zone.addEventListener('click', () => input.click());

    // File selected via dialog
    input.addEventListener('change', () => {
      if (input.files[0]) handleFile(input.files[0], type, zone);
      input.value = '';
    });

    // Drag & Drop
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('dragover');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file, type, zone);
    });
  }

  async function handleFile(file, type, zone) {
    const label = type === 'students' ? 'स्टुडेंट' : 'मेंटर';
    zone.style.opacity = '0.6';

    try {
      const result = await RoneCsv.readFile(file, type);
      zone.style.opacity = '1';

      if (result.errors.length) {
        const errMsg = result.errors.slice(0, 3).join('\n');
        toast(`⚠ ${result.imported} ${label} import हुए, ${result.errors.length} errors`, 5000);
        console.warn('Import errors:', result.errors);
      } else {
        toast(`✓ ${result.imported} ${label} successfully import हुए!`);
      }

      RoneRender.refreshAll();
      // Auto-switch to relevant tab
      const tabName = type === 'students' ? 'students' : 'mentors';
      document.querySelector(`[data-tab="${tabName}"]`).click();

    } catch (e) {
      zone.style.opacity = '1';
      toast(`✗ Error: ${e.message}`);
    }
  }

  // ── Auto-assign ────────────────────────────
  function initAutoAssign() {
    document.getElementById('btn-auto-assign').addEventListener('click', () => {
      const count = RoneData.autoAssign();
      RoneRender.refreshAll();
      toast(count > 0
        ? `✓ ${count} स्टुडेंट को auto-assign किया गया!`
        : 'सभी उपलब्ध mentor slots भर गए हैं।'
      );
    });
  }

  // ── Manual assign (from allocation panel) ──
  function openAssign(studentId) {
    const student  = RoneData.getStudentById(studentId);
    const mentors  = RoneData.getAllMentors().filter(m => m.assigned < m.capacity);

    if (!mentors.length) { toast('कोई भी मेंटर उपलब्ध नहीं है।'); return; }
    if (!student)        { toast('स्टुडेंट नहीं मिला।'); return; }

    // Simple prompt-based selection (can be replaced with a custom modal)
    const options = mentors.map((m, i) => `${i + 1}. ${m.name} (${m.specialisation}) — ${m.assigned}/${m.capacity}`).join('\n');
    const choice  = prompt(`${student.name} के लिए मेंटर चुनें:\n\n${options}\n\nनंबर दर्ज करें:`);

    const idx = parseInt(choice) - 1;
    if (isNaN(idx) || idx < 0 || idx >= mentors.length) return;

    const ok = RoneData.assign(studentId, mentors[idx].id);
    if (ok) {
      RoneRender.refreshAll();
      toast(`✓ ${student.name} → ${mentors[idx].name}`);
    } else {
      toast('एलोकेशन नहीं हो सकी।');
    }
  }

  // ── Init ───────────────────────────────────
  function init() {
    initTabs();
    initSearch();
    initModal();
    initUpload();
    initAutoAssign();
    RoneRender.refreshAll();
  }

  // Wait for DOM
  document.addEventListener('DOMContentLoaded', init);

  // Public (used by inline onclick)
  return { openAssign, toast };
})();
