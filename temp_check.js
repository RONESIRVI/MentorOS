
    import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
    import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
    import { getFirestore, doc, getDoc, collection, getDocs, setDoc, query, where, updateDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
    import { firebaseConfig } from '../firebase-config.js';
    import { initSessionManager } from '../session-manager.js';

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    // Authentication Guard
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().role === 'mentor') {
            const data = docSnap.data();
            const namePart = (data.name || user.email).split('@')[0];
            const welcomeMessage = document.getElementById('welcome-message');
            if (welcomeMessage) welcomeMessage.textContent = `Welcome, ${namePart}! 👋`;
            
            const avatar = document.getElementById('topbar-avatar');
            if (avatar) avatar.textContent = namePart.charAt(0).toUpperCase();

            // Format date
            const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const dateEl = document.getElementById('current-date');
            if(dateEl) dateEl.textContent = dateStr;

            initSessionManager(auth, signOut, '../index.html');
            
            // Load initial data
            loadMentorData();
          } else {
            alert('Access Denied. Mentor role required.');
            await signOut(auth);
            window.location.href = '../index.html';
          }
        } catch (e) {
          console.error(e);
          window.location.href = '../index.html';
        }
      } else {
        window.location.href = '../index.html';
      }
    });

    const btnLogoutTop = document.getElementById('btnLogoutTop');
    if (btnLogoutTop) {
      btnLogoutTop.addEventListener('click', () => {
        signOut(auth).then(() => window.location.href = '../index.html');
      });
    }

    // Navigation Logic
    window.switchMentorSection = function(sectionId) {
      document.querySelectorAll('.admin-section').forEach(el => el.style.display = 'none');
      const sec = document.getElementById(`section-${sectionId}`);
      if (sec) sec.style.display = 'block';

      document.querySelectorAll('.sidebar-nav-item').forEach(el => el.classList.remove('active'));
      const activeLink = document.querySelector(`a[onclick*="${sectionId}"]`);
      if (activeLink) activeLink.classList.add('active');

      if(sectionId === 'overview') loadMentorData();
      if(sectionId === 'students') loadStudents();
      if(sectionId === 'evaluations') loadEvaluations();
      if(sectionId === 'schedule') loadSchedule();
    };

    const _esc = (s) => (s||'').replace(/'/g, '&apos;').replace(/"/g, '&quot;');

    // Main Data Load
    async function loadMentorData() {
      try {
        // Students
        const stuSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        document.getElementById('stat-students').textContent = stuSnap.size;

        // Evaluations
        const evSnap = await getDocs(collection(db, 'evaluations'));
        let pending = 0;
        evSnap.forEach(d => { if(d.data().status === 'Pending') pending++; });
        document.getElementById('stat-evals').textContent = pending;

        // Schedule
        const scSnap = await getDocs(collection(db, 'meetings'));
        document.getElementById('stat-meetings').textContent = scSnap.size;
      } catch (e) {
        console.error('Stats load error', e);
      }
    }

    async function loadStudents() {
      const tbody = document.getElementById('students-table-body');
      tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;">Loading...</td></tr>';
      try {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'student')));
        let html = '';
        snap.forEach(d => {
          const user = d.data();
          html += `<tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:15px; font-weight:600;">${_esc(user.name||'Student')}</td>
            <td style="padding:15px; color:#64748b;">${_esc(user.email)}</td>
            <td style="padding:15px;">Active</td>
            <td style="padding:15px; text-align:right;">
              <button onclick="alert('View progress coming soon')" class="btn-meet" style="border-color:#10b981; color:#10b981;">Progress</button>
            </td>
          </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="4" style="padding:20px;text-align:center;">No students found</td></tr>';
      } catch(e) {
        tbody.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:red;">Error loading students</td></tr>';
      }
    }

    async function loadEvaluations() {
      const tbody = document.getElementById('evaluations-table-body');
      tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;">Loading...</td></tr>';
      try {
        const snap = await getDocs(collection(db, 'evaluations'));
        let html = '';
        snap.forEach(d => {
          const ev = d.data();
          const isPending = ev.status === 'Pending';
          const badge = isPending ? '<span style="background:#fef3c7;color:#d97706;padding:4px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;">Pending</span>' : '<span style="background:#dcfce7;color:#166534;padding:4px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;">Evaluated</span>';
          html += `<tr style="border-bottom:1px solid #e2e8f0;">
            <td style="padding:15px; font-weight:600;">${_esc(ev.studentName)}</td>
            <td style="padding:15px;">${_esc(ev.assignmentTitle)}</td>
            <td style="padding:15px;">${badge}</td>
            <td style="padding:15px;">${ev.marks ? ev.marks+'/100' : '-'}</td>
            <td style="padding:15px; text-align:right;">
              ${isPending ? `<button onclick="window.openEvalModal('${d.id}')" class="btn-evaluate">Evaluate</button>` : `<button onclick="window.viewEval('${d.id}')" class="btn-meet">View</button>`}
            </td>
          </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="5" style="padding:20px;text-align:center;">No evaluations found</td></tr>';
      } catch(e) {
        tbody.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:red;">Error loading evaluations</td></tr>';
      }
    }

    async function loadSchedule() {
      const list = document.getElementById('meeting-list-container');
      list.innerHTML = '<div style="padding:20px;">Loading meetings...</div>';
      try {
        const snap = await getDocs(collection(db, 'meetings'));
        let html = '';
        snap.forEach(d => {
          const m = d.data();
          html += `<div class="meeting-item">
            <div class="meeting-time">${_esc(m.time)}</div>
            <div class="meeting-info" style="flex:1;">
              <h4>${_esc(m.title)} — ${_esc(m.studentName)}</h4>
              <p>${_esc(m.description)}</p>
            </div>
            <a href="${_esc(m.link)}" target="_blank" class="btn-meet" style="align-self:center;">Join Meet</a>
          </div>`;
        });
        list.innerHTML = html || '<div style="padding:20px;">No upcoming meetings.</div>';
      } catch(e) {
        list.innerHTML = '<div style="padding:20px;color:red;">Error loading meetings</div>';
      }
    }

    // Eval Modal logic
    window.openEvalModal = async function(id) {
      document.getElementById('eval-id').value = id;
      document.getElementById('eval-marks').value = '';
      document.getElementById('eval-feedback').value = '';
      document.getElementById('eval-modal').style.display = 'flex';
    };
    window.closeEvalModal = function() {
      document.getElementById('eval-modal').style.display = 'none';
    };
    window.saveEval = async function() {
      const id = document.getElementById('eval-id').value;
      const marks = document.getElementById('eval-marks').value;
      const feedback = document.getElementById('eval-feedback').value;
      try {
        await updateDoc(doc(db, 'evaluations', id), {
          marks: marks,
          feedback: feedback,
          status: 'Evaluated',
          evaluatedAt: new Date().toISOString()
        });
        alert('Evaluation saved!');
        closeEvalModal();
        loadEvaluations();
      } catch(e) {
        alert('Failed to save evaluation');
      }
    };
    
    // Meet Modal logic
    window.openMeetModal = function() {
      document.getElementById('meet-modal').style.display = 'flex';
    };
    window.closeMeetModal = function() {
      document.getElementById('meet-modal').style.display = 'none';
    };
    window.saveMeet = async function() {
      const title = document.getElementById('meet-title').value;
      const name = document.getElementById('meet-student').value;
      const time = document.getElementById('meet-time').value;
      const link = document.getElementById('meet-link').value;
      if(!title || !name || !time || !link) { alert('All fields required'); return; }
      try {
        await setDoc(doc(db, 'meetings', Date.now().toString()), {
          title, studentName: name, time, link, description: 'Scheduled by Mentor'
        });
        alert('Meeting scheduled!');
        closeMeetModal();
        loadSchedule();
      } catch(e) {
        alert('Failed to schedule meeting');
      }
    };

    window.switchMentorSection('overview');

  