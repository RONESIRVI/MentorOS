/* ═══════════════════════════════════════════════
   data.js — RONE MentorOS
   App state & data helpers
═══════════════════════════════════════════════ */

const RoneData = (() => {

  // ── State ──────────────────────────────────
  let state = {
    students: [],
    mentors:  [],
    nextStudentId: 1,
    nextMentorId:  1,
  };

  // ── ID Generator ───────────────────────────
  function genStudentId() {
    const n = String(state.nextStudentId).padStart(4, '0');
    state.nextStudentId++;
    return `RONE-STU-2025-${n}`;
  }

  function genMentorId() {
    const n = String(state.nextMentorId).padStart(4, '0');
    state.nextMentorId++;
    return `RONE-MNT-2025-${n}`;
  }

  // ── Initials from name ─────────────────────
  function initials(name = '') {
    return name.trim().split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
  }

  // ── Add Student ────────────────────────────
  function addStudent(raw) {
    const student = {
      id:        genStudentId(),
      name:      (raw.name || '').trim(),
      class:     (raw.class || raw['class'] || 'XI').trim(),
      stream:    (raw.stream || 'Science').trim(),
      subject:   (raw.subject || '').trim(),
      goal:      (raw.goal || '').trim(),
      city:      (raw.city || '').trim(),
      email:     (raw.email || '').trim(),
      phone:     (raw.phone || '').trim(),
      mentorId:  (raw.mentor_id || '').trim(),
      initials:  initials(raw.name),
      addedAt:   new Date().toISOString(),
    };
    state.students.push(student);
    saveLocal();
    return student;
  }

  // ── Add Mentor ─────────────────────────────
  function addMentor(raw) {
    const mentor = {
      id:             genMentorId(),
      name:           (raw.name || '').trim(),
      specialisation: (raw.specialisation || raw.spec || 'General').trim(),
      institution:    (raw.institution || '').trim(),
      capacity:       parseInt(raw.capacity) || 8,
      email:          (raw.email || '').trim(),
      rating:         parseFloat(raw.rating) || 0,
      assigned:       0,
      initials:       initials(raw.name),
      addedAt:        new Date().toISOString(),
    };
    state.mentors.push(mentor);
    saveLocal();
    return mentor;
  }

  // ── Assign mentor to student ───────────────
  function assign(studentId, mentorId) {
    const student = state.students.find(s => s.id === studentId);
    const mentor  = state.mentors.find(m => m.id === mentorId);
    if (!student || !mentor) return false;
    if (mentor.assigned >= mentor.capacity) return false;

    // Un-assign old mentor if any
    if (student.mentorId) {
      const old = state.mentors.find(m => m.id === student.mentorId);
      if (old) old.assigned = Math.max(0, old.assigned - 1);
    }

    student.mentorId = mentorId;
    mentor.assigned++;
    saveLocal();
    return true;
  }

  // ── Auto-assign (goal/specialisation match) ─
  function autoAssign() {
    let count = 0;
    const unassigned = state.students.filter(s => !s.mentorId);

    unassigned.forEach(student => {
      // Find best mentor match
      const available = state.mentors.filter(m => m.assigned < m.capacity);
      if (!available.length) return;

      // Score: specialisation keyword match
      const scored = available.map(m => {
        const spec = m.specialisation.toLowerCase();
        const goal = student.goal.toLowerCase();
        const sub  = student.subject.toLowerCase();
        let score = 0;
        if (spec.includes('jee') && goal.includes('jee')) score += 2;
        if (spec.includes('neet') && goal.includes('neet')) score += 2;
        if (spec.includes('ca') && goal.includes('ca')) score += 2;
        if (spec.includes('cuet') && goal.includes('cuet')) score += 2;
        if (spec.includes('maths') && sub.includes('maths')) score += 1;
        if (spec.includes('physics') && sub.includes('physics')) score += 1;
        if (spec.includes('biology') && sub.includes('biology')) score += 1;
        if (spec.includes('chemistry') && sub.includes('chem')) score += 1;
        if (spec.includes('commerce') && sub.includes('accounts')) score += 1;
        // Prefer mentor with least load
        score += (1 - mentor.assigned / mentor.capacity) * 0.5;
        return { mentor: m, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0]?.mentor;
      if (best) { assign(student.id, best.id); count++; }
    });

    return count;
  }

  // ── Stats ──────────────────────────────────
  function stats() {
    const total     = state.students.length;
    const allocated = state.students.filter(s => s.mentorId).length;
    return {
      students:  total,
      mentors:   state.mentors.length,
      allocated,
      pending:   total - allocated,
      pct:       total ? Math.round((allocated / total) * 100) : 0,
    };
  }

  // ── Filter helpers ─────────────────────────
  function filterStudents(query = '') {
    const q = query.toLowerCase();
    if (!q) return [...state.students];
    return state.students.filter(s =>
      s.name.toLowerCase().includes(q)    ||
      s.id.toLowerCase().includes(q)      ||
      s.goal.toLowerCase().includes(q)    ||
      s.city.toLowerCase().includes(q)    ||
      s.subject.toLowerCase().includes(q)
    );
  }

  function filterMentors(query = '') {
    const q = query.toLowerCase();
    if (!q) return [...state.mentors];
    return state.mentors.filter(m =>
      m.name.toLowerCase().includes(q)           ||
      m.id.toLowerCase().includes(q)             ||
      m.specialisation.toLowerCase().includes(q) ||
      m.institution.toLowerCase().includes(q)
    );
  }

  function getMentorById(id) { return state.mentors.find(m => m.id === id); }
  function getStudentById(id) { return state.students.find(s => s.id === id); }
  function getAllMentors()  { return [...state.mentors]; }
  function getAllStudents() { return [...state.students]; }

  // ── LocalStorage persistence ───────────────
  function saveLocal() {
    try {
      localStorage.setItem('rone_students',      JSON.stringify(state.students));
      localStorage.setItem('rone_mentors',       JSON.stringify(state.mentors));
      localStorage.setItem('rone_next_stu',      state.nextStudentId);
      localStorage.setItem('rone_next_mnt',      state.nextMentorId);
    } catch(e) { /* silent fail */ }
  }

  function loadLocal() {
    try {
      const stu = localStorage.getItem('rone_students');
      const mnt = localStorage.getItem('rone_mentors');
      if (stu) state.students      = JSON.parse(stu);
      if (mnt) state.mentors       = JSON.parse(mnt);
      state.nextStudentId = parseInt(localStorage.getItem('rone_next_stu')) || 1;
      state.nextMentorId  = parseInt(localStorage.getItem('rone_next_mnt')) || 1;
    } catch(e) { /* silent fail */ }
  }

  function clearAll() {
    state = { students: [], mentors: [], nextStudentId: 1, nextMentorId: 1 };
    localStorage.removeItem('rone_students');
    localStorage.removeItem('rone_mentors');
    localStorage.removeItem('rone_next_stu');
    localStorage.removeItem('rone_next_mnt');
  }

  // ── Init ───────────────────────────────────
  loadLocal();

  // Public API
  return {
    addStudent, addMentor,
    assign, autoAssign,
    stats,
    filterStudents, filterMentors,
    getMentorById, getStudentById,
    getAllMentors, getAllStudents,
    initials, saveLocal, clearAll,
  };
})();
