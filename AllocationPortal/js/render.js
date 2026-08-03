/* ═══════════════════════════════════════════════
   render.js — RONE MentorOS
   ID Card HTML generators & DOM updaters
═══════════════════════════════════════════════ */

const RoneRender = (() => {

  // ── Student ID Card ────────────────────────
  function studentCard(s) {
    const mentor   = s.mentorId ? RoneData.getMentorById(s.mentorId) : null;
    const mentorHtml = mentor
      ? `<div class="mentor-link">
           <span class="status-dot dot-green"></span>
           <span style="color:var(--green-text);font-weight:500">मेंटर:</span>
           <span style="color:var(--text-2)">${mentor.name}</span>
         </div>`
      : `<div class="mentor-link">
           <span class="status-dot dot-amber"></span>
           <span style="color:var(--amber-text);font-weight:500">Pending —</span>
           <span style="color:var(--text-muted)">एलोकेशन बाकी है</span>
         </div>`;

    return `
      <div class="id-card" data-id="${s.id}">
        <div class="card-stripe ${s.mentorId ? 'stripe-student' : 'stripe-pending'}"></div>
        <div class="card-body">
          <div class="card-top">
            <div class="avatar avatar-student">${s.initials}</div>
            <div class="card-meta">
              <div class="card-name" title="${s.name}">${s.name}</div>
              <div class="card-role">Student · Class ${s.class} ${s.stream}</div>
              <div class="card-id">${s.id}</div>
            </div>
            <span class="card-badge badge-student">Student</span>
          </div>
          <div class="card-details">
            <div>
              <div class="detail-label">विषय</div>
              <div class="detail-value">${s.subject || '—'}</div>
            </div>
            <div>
              <div class="detail-label">लक्ष्य</div>
              <div class="detail-value">${s.goal || '—'}</div>
            </div>
            <div>
              <div class="detail-label">स्थान</div>
              <div class="detail-value">${s.city || '—'}</div>
            </div>
            <div>
              <div class="detail-label">Session</div>
              <div class="detail-value">2025–26</div>
            </div>
          </div>
          ${mentorHtml}
        </div>
      </div>`;
  }

  // ── Mentor ID Card ─────────────────────────
  function mentorCard(m) {
    const pct  = m.capacity > 0 ? Math.round((m.assigned / m.capacity) * 100) : 0;
    const full = m.assigned >= m.capacity;
    const slotsLeft = m.capacity - m.assigned;

    const statusHtml = full
      ? `<span class="status-dot dot-red"></span><span style="color:var(--red-text);font-weight:500">Full — नई एलोकेशन बंद</span>`
      : `<span class="status-dot dot-green"></span><span style="color:var(--text-2)">${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} उपलब्ध</span>`;

    const ratingHtml = m.rating
      ? `<div class="detail-label">Rating</div><div class="detail-value">${m.rating.toFixed(1)} ★</div>`
      : `<div class="detail-label">Rating</div><div class="detail-value">—</div>`;

    return `
      <div class="id-card" data-id="${m.id}">
        <div class="card-stripe stripe-mentor"></div>
        <div class="card-body">
          <div class="card-top">
            <div class="avatar avatar-mentor">${m.initials}</div>
            <div class="card-meta">
              <div class="card-name" title="${m.name}">${m.name}</div>
              <div class="card-role">Mentor${m.institution ? ' · ' + m.institution : ''}</div>
              <div class="card-id">${m.id}</div>
            </div>
            <span class="card-badge badge-mentor">Mentor</span>
          </div>
          <div class="card-details">
            <div>
              <div class="detail-label">Specialisation</div>
              <div class="detail-value">${m.specialisation}</div>
            </div>
            <div>
              <div class="detail-label">Capacity</div>
              <div class="detail-value">${m.capacity} स्टुडेंट</div>
            </div>
            <div>
              <div class="detail-label">Assigned</div>
              <div class="detail-value">${m.assigned} / ${m.capacity}</div>
            </div>
            <div>${ratingHtml}</div>
          </div>
          <div class="capacity-bar-wrap">
            <div class="capacity-label">
              <span>Slot usage</span><span>${pct}%</span>
            </div>
            <div class="capacity-bar">
              <div class="capacity-fill ${full ? 'full' : ''}" style="width:${pct}%"></div>
            </div>
          </div>
          <div class="mentor-link">${statusHtml}</div>
        </div>
      </div>`;
  }

  // ── Allocation Row ─────────────────────────
  function allocRow(student, mentor, pending = false) {
    const mentorHtml = mentor
      ? `<div class="alloc-avatar avatar-mentor">${mentor.initials}</div>
         <div class="alloc-info">
           <div class="alloc-name">${mentor.name}</div>
           <div class="alloc-sub">${mentor.id}</div>
         </div>
         <span class="status-dot dot-green"></span>`
      : `<div class="alloc-avatar" style="background:var(--surface-2);color:var(--text-muted)">?</div>
         <div class="alloc-info">
           <div class="alloc-name" style="color:var(--text-muted)">Unassigned</div>
           <div class="alloc-sub">एलोकेशन बाकी है</div>
         </div>
         <button class="assign-btn" onclick="RoneApp.openAssign('${student.id}')">Assign करें</button>`;

    return `
      <div class="alloc-row">
        <div class="alloc-avatar avatar-student">${student.initials}</div>
        <div class="alloc-info">
          <div class="alloc-name">${student.name}</div>
          <div class="alloc-sub">${student.id} · ${student.goal}</div>
        </div>
        <div class="alloc-arrow">→</div>
        ${mentorHtml}
      </div>`;
  }

  // ── Update Stats display ───────────────────
  function updateStats() {
    const s = RoneData.stats();
    document.getElementById('stat-students').textContent  = s.students;
    document.getElementById('stat-mentors').textContent   = s.mentors;
    document.getElementById('stat-allocated').textContent = s.allocated;
    document.getElementById('stat-pending').textContent   = s.pending;
    document.getElementById('stat-pct').textContent       = s.pct + '%';
  }

  // ── Render student grid ────────────────────
  function renderStudents(query = '') {
    const grid = document.getElementById('grid-students');
    const list = RoneData.filterStudents(query);
    document.getElementById('count-students').textContent = `${list.length} स्टुडेंट`;

    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">
        <i class="ti ti-users"></i>
        <p>${query ? 'कोई नतीजा नहीं मिला।' : 'अभी कोई स्टुडेंट नहीं है।<br/>CSV अपलोड करें या नया जोड़ें।'}</p>
      </div>`;
      return;
    }
    grid.innerHTML = list.map(studentCard).join('');
  }

  // ── Render mentor grid ─────────────────────
  function renderMentors(query = '') {
    const grid = document.getElementById('grid-mentors');
    const list = RoneData.filterMentors(query);
    document.getElementById('count-mentors').textContent = `${list.length} मेंटर`;

    if (!list.length) {
      grid.innerHTML = `<div class="empty-state">
        <i class="ti ti-school"></i>
        <p>${query ? 'कोई नतीजा नहीं मिला।' : 'अभी कोई मेंटर नहीं है।<br/>CSV अपलोड करें या नया जोड़ें।'}</p>
      </div>`;
      return;
    }
    grid.innerHTML = list.map(mentorCard).join('');
  }

  // ── Render allocation lists ────────────────
  function renderAllocation() {
    const confirmed = document.getElementById('list-confirmed');
    const pending   = document.getElementById('list-pending');

    const students  = RoneData.getAllStudents();
    const assigned  = students.filter(s => s.mentorId);
    const unassigned = students.filter(s => !s.mentorId);

    if (assigned.length) {
      confirmed.innerHTML = assigned.map(s => {
        const m = RoneData.getMentorById(s.mentorId);
        return allocRow(s, m, false);
      }).join('');
    } else {
      confirmed.innerHTML = '<div class="empty-state small">कोई confirmed एलोकेशन नहीं।</div>';
    }

    if (unassigned.length) {
      pending.innerHTML = unassigned.map(s => allocRow(s, null, true)).join('');
    } else {
      pending.innerHTML = '<div class="empty-state small" style="color:var(--green-text)">✓ सभी स्टुडेंट assign हो गए!</div>';
    }
  }

  // ── Full refresh ───────────────────────────
  function refreshAll() {
    updateStats();
    renderStudents();
    renderMentors();
    renderAllocation();
  }

  return {
    studentCard, mentorCard,
    updateStats, renderStudents, renderMentors,
    renderAllocation, refreshAll,
  };
})();
