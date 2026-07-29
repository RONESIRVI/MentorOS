
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, doc, getDoc, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
    import { initSessionManager } from '../session-manager.js';

    // Same config as index.html
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

    // Set Date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', options);

    // Auth state listener
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Enforce Admin Role
        let role = 'Aspirant';
        const emailLower = user.email.toLowerCase();
        if (emailLower === 'figuring.cse@gmail.com') {
          role = 'admin';
        } else {
          try {
            const roleDoc = await getDoc(doc(db, 'userRoles', emailLower));
            if (roleDoc.exists()) role = roleDoc.data().role || 'Aspirant';
          } catch (err) {}
        }
        
        if (role.toLowerCase() !== 'admin') {
          window.location.href = '../index.html';
          return;
        }

        // User logged in
        const email = user.email;
        const namePart = email.split('@')[0];
        window.cachedUserName = namePart;
        const initial = namePart.charAt(0).toUpperCase();

        // Update topbar avatar immediately
        const topbarAvatar = document.getElementById('topbar-avatar');
        if (topbarAvatar) topbarAvatar.textContent = initial;

        // If overview is already loaded, update it
        const welcomeMessage = document.getElementById('welcome-message');
        if (welcomeMessage) {
          welcomeMessage.textContent = `System Overview, ${namePart} 🚀`;
        }

        // Start session inactivity timer (7 min idle → 3 min warning → logout)
        initSessionManager(auth, signOut, '../index.html');

      } else {
        // Not logged in -> redirect to login
        window.location.href = '../index.html';
      }
    });

    // Logout
    const btnLogoutTop = document.getElementById('btnLogoutTop');
    if (btnLogoutTop) {
      btnLogoutTop.addEventListener('click', () => {
        signOut(auth).then(() => {
          window.location.href = '../index.html';
        });
      });
    }

    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // --- SPA NAVIGATION LOGIC (Inline, no fetch needed) ---
    window.switchAdminSection = function(sectionId) {
      // Hide all sections
      document.querySelectorAll('.admin-section').forEach(sec => {
        sec.style.display = 'none';
      });
      // Show target section
      const target = document.getElementById('section-' + sectionId);
      if (target) target.style.display = 'block';
      
      // Update sidebar nav active state
      document.querySelectorAll('.sidebar-nav-item').forEach(nav => nav.classList.remove('active'));
      const activeNav = document.getElementById('nav-' + sectionId);
      if (activeNav) activeNav.classList.add('active');

      // Close mobile sidebar if open
      if (window.innerWidth <= 768) sidebar.classList.remove('open');

      // Auto-load users when switching to users section
      if (sectionId === 'users') window.loadUsersList();
    };

    // --- USER MANAGEMENT LOGIC ---
    window.loadUsersList = async function() {
      const tbody = document.getElementById('admin-users-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="3" style="padding:20px;text-align:center;color:#64748b;">Fetching latest users...</td></tr>';
      try {
        const querySnapshot = await getDocs(collection(db, 'userRoles'));
        let html = '';
        let totalUsers = 0;
        querySnapshot.forEach((docSnap) => {
          totalUsers++;
          const email = docSnap.id;
          const role = docSnap.data().role || 'Aspirant';
          const initial = email.charAt(0).toUpperCase();
          const badgeClass = role.toLowerCase() === 'aspirant' ? 'status-pending' : 'status-active';
          html += `
            <tr style="border-bottom:1px solid #f1f5f9;">
              <td style="padding:12px;">
                <div style="display:flex;align-items:center;gap:12px;">
                  <div style="width:36px;height:36px;background:#e2e8f0;color:#475569;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:bold;">${initial}</div>
                  <span style="font-weight:600;color:#0f172a;">${email}</span>
                </div>
              </td>
              <td style="padding:12px;"><span class="status-badge ${badgeClass}">${role.charAt(0).toUpperCase()+role.slice(1)}</span></td>
              <td style="padding:12px;text-align:right;">
                <select onchange="window.changeUserRole('${email}', this.value)" style="padding:6px;border:1px solid #e2e8f0;border-radius:6px;background:white;cursor:pointer;">
                  <option value="" disabled selected>Change Role...</option>
                  <option value="Aspirant">Aspirant</option>
                  <option value="Mentor">Mentor</option>
                  <option value="Admin">Admin</option>
                </select>
              </td>
            </tr>`;
        });
        tbody.innerHTML = html || '<tr><td colspan="3" style="padding:20px;text-align:center;color:#64748b;">No users found.</td></tr>';
        const el = document.getElementById('stat-total-users');
        if (el) el.textContent = totalUsers;
      } catch (error) {
        console.error('Error fetching users:', error);
        tbody.innerHTML = '<tr><td colspan="3" style="padding:20px;text-align:center;color:#ef4444;">Failed to load users. Check Firestore permissions.</td></tr>';
      }
    };

    window.changeUserRole = async function(email, newRole) {
      if (!confirm(`Are you sure you want to make ${email} a ${newRole}?`)) return;
      try {
        await setDoc(doc(db, 'userRoles', email), { role: newRole }, { merge: true });
        alert(`✅ Successfully updated ${email} to ${newRole}!`);
        window.loadUsersList();
      } catch (error) {
        console.error('Error updating role:', error);
        alert('❌ Failed to update role. Check Firestore permissions.');
      }
    };


    // Show overview section on load
    window.switchAdminSection('overview');

    // REVENUE & SALES - FIRESTORE CRUD LOGIC
    let _allTransactions = [];

    window.loadRevenueData = async function() {
      const tbody = document.getElementById('txn-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="7" style="padding:30px;text-align:center;color:#64748b;">Loading...</td></tr>';
      try {
        const snapshot = await getDocs(collection(db, 'transactions'));
        _allTransactions = [];
        snapshot.forEach(ds => _allTransactions.push({ id: ds.id, ...ds.data() }));
        // Sort by date desc
        _allTransactions.sort((a, b) => (b.date||'').localeCompare(a.date||''));
        window.renderTransactions(_allTransactions);
        window.updateRevenueStats(_allTransactions);
        window.renderRevenueChart(_allTransactions);
      } catch (err) {
        console.error('Revenue load error:', err);
        tbody.innerHTML = '<tr><td colspan="7" style="padding:30px;text-align:center;color:#ef4444;">Failed to load. Check Firestore permissions.</td></tr>';
      }
    };

    window.renderTransactions = function(txns) {
      const tbody = document.getElementById('txn-table-body');
      if (!tbody) return;
      if (!txns.length) { tbody.innerHTML = '<tr><td colspan="7" style="padding:30px;text-align:center;color:#64748b;">No transactions yet. Click "+ Add Transaction" to begin!</td></tr>'; return; }
      let html = '';
      txns.forEach(t => {
        const st = t.status||'Paid';
        const bc = st==='Paid'?'#dcfce7;color:#166534':st==='Pending'?'#fef3c7;color:#92400e':st==='Partial'?'#dbeafe;color:#1d4ed8':'#fee2e2;color:#991b1b';
        html += '<tr style="border-bottom:1px solid #f1f5f9;">'
          + '<td style="padding:12px;"><div style="font-weight:600;color:#0f172a;">'+(t.student||'&mdash;')+'</div></td>'
          + '<td style="padding:12px;font-size:0.9rem;color:#475569;">'+(t.course||'&mdash;')+'</td>'
          + '<td style="padding:12px;font-weight:700;color:#0f172a;">&#8377;'+parseInt(t.amount||0).toLocaleString('en-IN')+'</td>'
          + '<td style="padding:12px;"><span style="background:#f1f5f9;padding:3px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;color:#475569;">'+(t.mode||'UPI')+'</span></td>'
          + '<td style="padding:12px;color:#475569;font-size:0.9rem;">'+(t.date||'&mdash;')+'</td>'
          + '<td style="padding:12px;"><span style="padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;background:'+bc+';">'+st+'</span></td>'
          + '<td style="padding:12px;text-align:right;">'
          + (st==='Pending' ? '<button onclick="window.approveTxn(\\''+t.id+'\\')" style="padding:5px 10px;font-size:0.8rem;border-radius:6px;border:none;background:#10b981;cursor:pointer;font-weight:600;margin-right:5px;color:white;">Approve</button>' : '')
          + '<button onclick="window.openEditTxnModal(\\''+t.id+'\\')" style="padding:5px 10px;font-size:0.8rem;border-radius:6px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-weight:600;margin-right:5px;color:#475569;">Edit</button>'
          + '<button onclick="window.deleteTxn(\\''+t.id+'\\')" style="padding:5px 10px;font-size:0.8rem;border-radius:6px;border:1px solid #fee2e2;background:#fff5f5;cursor:pointer;font-weight:600;color:#ef4444;">Del</button>'
          + '</td></tr>';
      });
      tbody.innerHTML = html;
    };

    window.filterTransactions = function() {
      const filter = document.getElementById('txn-filter-status').value;
      const filtered = filter ? _allTransactions.filter(t => t.status === filter) : _allTransactions;
      window.renderTransactions(filtered);
    };

    window.updateRevenueStats = function(txns) {
      const now = new Date();
      const monthKey = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

      let total=0, monthTotal=0, pendingTotal=0, pendingCount=0;
      txns.forEach(t => {
        const amt = parseInt(t.amount||0);
        if (t.status === 'Paid' || t.status === 'Partial') {
          total += amt;
          if ((t.date||'').startsWith(monthKey)) monthTotal += amt;
        }
        if (t.status === 'Pending' || t.status === 'Partial') {
          pendingTotal += amt; pendingCount++;
        }
      });

      const fmt = v => v >= 100000 ? (v/100000).toFixed(1)+'L' : v >= 1000 ? (v/1000).toFixed(1)+'K' : v;
      const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
      s('rev-total', '&#8377;'+fmt(total));
      s('rev-month', '&#8377;'+fmt(monthTotal));
      s('rev-month-label', monthNames[now.getMonth()]+' '+now.getFullYear());
      s('rev-pending', '&#8377;'+fmt(pendingTotal));
      s('rev-pending-count', pendingCount+' pending');
      s('rev-count', txns.length);

      // Use innerHTML for rupee symbol
      ['rev-total','rev-month','rev-pending'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = el.textContent;
      });
    };

    window.renderRevenueChart = function(txns) {
      const chartEl = document.getElementById('rev-chart');
      const labelsEl = document.getElementById('rev-chart-labels');
      if (!chartEl) return;

      // Build last 6 months data
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0');
        const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        months.push({ key, label: names[d.getMonth()], total: 0 });
      }

      txns.forEach(t => {
        if ((t.status==='Paid'||t.status==='Partial') && t.date) {
          const mk = t.date.substring(0,7);
          const m = months.find(m => m.key === mk);
          if (m) m.total += parseInt(t.amount||0);
        }
      });

      const maxVal = Math.max(...months.map(m=>m.total), 1);
      const colors = ['#c7d2fe','#a5b4fc','#818cf8','#6366f1','#4f46e5','#4338ca'];

      chartEl.innerHTML = months.map((m,i) => {
        const h = Math.max(Math.round((m.total/maxVal)*140), m.total?4:0);
        const fmt = v => v>=100000?(v/100000).toFixed(1)+'L':v>=1000?(v/1000).toFixed(1)+'K':v||'0';
        return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">'
          + '<div style="font-size:0.75rem;font-weight:700;color:#6366f1;">'+fmt(m.total)+'</div>'
          + '<div style="width:100%;background:'+colors[i]+';border-radius:6px 6px 0 0;height:'+h+'px;transition:height 0.5s ease;cursor:pointer;position:relative;" title="'+m.label+': Rs.'+m.total.toLocaleString('en-IN')+'"></div>'
          + '</div>';
      }).join('');

      labelsEl.innerHTML = months.map(m =>
        '<div style="flex:1;text-align:center;font-size:0.8rem;font-weight:600;color:#64748b;">'+m.label+'</div>'
      ).join('');
    };

    window.openAddTxnModal = function() {
      document.getElementById('txn-modal-title').textContent = '+ Add Transaction';
      ['tf-student','tf-course','tf-amount','tf-notes'].forEach(id=>document.getElementById(id).value='');
      document.getElementById('tf-date').value = new Date().toISOString().split('T')[0];
      document.getElementById('tf-mode').value = 'UPI';
      document.getElementById('tf-status').value = 'Paid';
      document.getElementById('tf-edit-id').value = '';
      document.getElementById('txn-modal').style.display = 'flex';
    };

    window.openEditTxnModal = async function(txnId) {
      const t = _allTransactions.find(t => t.id === txnId);
      if (!t) { alert('Transaction not found!'); return; }
      document.getElementById('txn-modal-title').textContent = 'Edit Transaction';
      document.getElementById('tf-student').value = t.student||'';
      document.getElementById('tf-course').value = t.course||'';
      document.getElementById('tf-amount').value = t.amount||'';
      document.getElementById('tf-date').value = t.date||'';
      document.getElementById('tf-mode').value = t.mode||'UPI';
      document.getElementById('tf-status').value = t.status||'Paid';
      document.getElementById('tf-notes').value = t.notes||'';
      document.getElementById('tf-edit-id').value = txnId;
      document.getElementById('txn-modal').style.display = 'flex';
    };

    window.closeTxnModal = function() {
      document.getElementById('txn-modal').style.display = 'none';
    };

    window.saveTxn = async function() {
      const student = document.getElementById('tf-student').value.trim();
      const amount  = document.getElementById('tf-amount').value.trim();
      if (!student || !amount) { alert('Student name and Amount are required!'); return; }
      const data = {
        student, amount: parseInt(amount),
        course: document.getElementById('tf-course').value.trim(),
        date:   document.getElementById('tf-date').value,
        mode:   document.getElementById('tf-mode').value,
        status: document.getElementById('tf-status').value,
        notes:  document.getElementById('tf-notes').value.trim(),
        updatedAt: new Date().toISOString()
      };
      const editId = document.getElementById('tf-edit-id').value;
      try {
        if (editId) {
          await setDoc(doc(db, 'transactions', editId), data, { merge: true });
          alert('Transaction updated!');
        } else {
          data.createdAt = new Date().toISOString();
          await setDoc(doc(db, 'transactions', Date.now().toString()), data);
          alert('Transaction saved!');
        }
        window.closeTxnModal();
        window.loadRevenueData();
      } catch (err) { console.error(err); alert('Failed to save. Check Firestore permissions.'); }
    };

    window.approveTxn = async function(txnId) {
      if(!confirm('Approve this transaction? This will mark it as Paid.')) return;
      try {
        const { updateDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await updateDoc(doc(db, 'transactions', txnId), { status: 'Paid', updatedAt: new Date().toISOString() });
        alert('Transaction Approved!');
        window.loadRevenueData();
      } catch (err) { console.error(err); alert('Failed to approve.'); }
    };

    window.deleteTxn = async function(txnId) {
      if (!confirm('Delete this transaction? This cannot be undone!')) return;
      try {
        const { deleteDoc: dd } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await dd(doc(db, 'transactions', txnId));
        alert('Deleted!');
        window.loadRevenueData();
      } catch (err) { console.error(err); alert('Failed to delete.'); }
    };

    // COURSES & BATCHES - FIRESTORE CRUD LOGIC

    window.loadCoursesList = async function() {
      const tbody = document.getElementById('courses-table-body');
      if (!tbody) return;
      tbody.innerHTML = '<tr><td colspan="6" style="padding:30px;text-align:center;color:#64748b;">Loading courses...</td></tr>';
      try {
        const snapshot = await getDocs(collection(db, 'courses'));
        let html = '', totalCourses=0, activeCourses=0, totalEnrolled=0, totalSeats=0;
        snapshot.forEach((docSnap) => {
          const d = docSnap.data(), id = docSnap.id;
          totalCourses++;
          if ((d.status||'Active') === 'Active') activeCourses++;
          totalEnrolled += parseInt(d.enrolled||0);
          totalSeats    += parseInt(d.seats||0);
          const status = d.status||'Active';
          const bc = status==='Active'?'#dcfce7;color:#166534':status==='Draft'?'#dbeafe;color:#1d4ed8':'#fee2e2;color:#991b1b';
          const epct = d.seats? Math.round((d.enrolled||0)/d.seats*100):0;
          const pc = epct>=90?'#ef4444':epct>=70?'#f59e0b':'#10b981';
          const safeName = (d.name||'').replace(/'/g, '&apos;');
          html += '<tr style="border-bottom:1px solid #f1f5f9;">'
            + '<td style="padding:12px;"><div style="font-weight:600;color:#0f172a;">'+(d.name||'&mdash;')+'</div>'
            + (d.description?'<div style="font-size:0.8rem;color:#64748b;margin-top:2px;">'+d.description.substring(0,60)+'</div>':'')
            + (d.startDate?'<div style="font-size:0.75rem;color:#94a3b8;margin-top:2px;">Starts: '+d.startDate+'</div>':'')
            + '</td>'
            + '<td style="padding:12px;"><span style="background:#f1f5f9;padding:3px 8px;border-radius:4px;font-size:0.8rem;font-weight:600;color:#475569;">'+(d.category||'General')+'</span></td>'
            + '<td style="padding:12px;"><div style="font-weight:600;color:#0f172a;">'+(d.enrolled||0)+' / '+(d.seats||'&mdash;')+'</div>'
            + '<div style="height:5px;background:#e2e8f0;border-radius:4px;margin-top:4px;width:80px;"><div style="height:100%;width:'+epct+'%;background:'+pc+';border-radius:4px;"></div></div></td>'
            + '<td style="padding:12px;font-weight:600;color:#0f172a;">'+(d.fee?'&#8377;'+parseInt(d.fee).toLocaleString('en-IN'):'&mdash;')+'</td>'
            + '<td style="padding:12px;"><span style="padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:600;background:'+bc+';">'+status+'</span></td>'
            + '<td style="padding:12px;text-align:right;">'
            + '<button onclick="window.openEditCourseModal(\''+id+'\')" style="padding:5px 12px;font-size:0.82rem;border-radius:6px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-weight:600;margin-right:6px;color:#475569;">Edit</button>'
            + '<button onclick="window.deleteCourse(\''+id+'\',\''+safeName+'\')" style="padding:5px 12px;font-size:0.82rem;border-radius:6px;border:1px solid #fee2e2;background:#fff5f5;cursor:pointer;font-weight:600;color:#ef4444;">Delete</button>'
            + '</td></tr>';
        });
        tbody.innerHTML = html || '<tr><td colspan="6" style="padding:30px;text-align:center;color:#64748b;">No courses yet. Click "+ Add New Course" to get started!</td></tr>';
        const s = (id,v) => { const e=document.getElementById(id); if(e) e.textContent=v; };
        s('cs-total',totalCourses); s('cs-active',activeCourses);
        s('cs-enrolled',totalEnrolled.toLocaleString('en-IN')); s('cs-seats',totalSeats.toLocaleString('en-IN'));
      } catch (err) {
        console.error('Courses load error:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="padding:30px;text-align:center;color:#ef4444;">Failed to load courses. Check Firestore permissions.</td></tr>';
      }
    };

    window.openAddCourseModal = function() {
      document.getElementById('course-modal-title').textContent = 'Add New Course';
      ['cf-name','cf-seats','cf-fee','cf-startdate','cf-desc'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('cf-category').value = 'UPSC';
      document.getElementById('cf-status').value = 'Active';
      document.getElementById('cf-edit-id').value = '';
      document.getElementById('course-modal').style.display = 'flex';
    };

    window.openEditCourseModal = async function(courseId) {
      try {
        const snap = await getDoc(doc(db, 'courses', courseId));
        if (!snap.exists()) { alert('Course not found!'); return; }
        const d = snap.data();
        document.getElementById('course-modal-title').textContent = 'Edit Course';
        document.getElementById('cf-name').value = d.name||'';
        document.getElementById('cf-seats').value = d.seats||'';
        document.getElementById('cf-fee').value = d.fee||'';
        document.getElementById('cf-category').value = d.category||'UPSC';
        document.getElementById('cf-startdate').value = d.startDate||'';
        document.getElementById('cf-status').value = d.status||'Active';
        document.getElementById('cf-desc').value = d.description||'';
        document.getElementById('cf-edit-id').value = courseId;
        document.getElementById('course-modal').style.display = 'flex';
      } catch (err) { alert('Error loading course.'); }
    };

    window.closeCourseModal = function() {
      document.getElementById('course-modal').style.display = 'none';
    };

    window.saveCourse = async function() {
      const name = document.getElementById('cf-name').value.trim();
      const seats = document.getElementById('cf-seats').value.trim();
      if (!name || !seats) { alert('Course Name and Max Seats are required!'); return; }
      const courseData = {
        name, seats: parseInt(seats),
        fee: parseInt(document.getElementById('cf-fee').value)||0,
        category: document.getElementById('cf-category').value,
        startDate: document.getElementById('cf-startdate').value,
        status: document.getElementById('cf-status').value,
        description: document.getElementById('cf-desc').value.trim(),
        updatedAt: new Date().toISOString()
      };
      const editId = document.getElementById('cf-edit-id').value;
      try {
        if (editId) {
          await setDoc(doc(db, 'courses', editId), courseData, { merge: true });
          alert('Course updated!');
        } else {
          courseData.enrolled = 0;
          courseData.createdAt = new Date().toISOString();
          await setDoc(doc(db, 'courses', Date.now().toString()), courseData);
          alert('Course added!');
        }
        window.closeCourseModal();
        window.loadCoursesList();
      } catch (err) { console.error(err); alert('Failed to save. Check Firestore permissions.'); }
    };

    window.deleteCourse = async function(courseId, courseName) {
      if (!confirm('DELETE "' + courseName + '"? This cannot be undone!')) return;
      try {
        const { deleteDoc: dd } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await dd(doc(db, 'courses', courseId));
        alert('Course deleted!');
        window.loadCoursesList();
      } catch (err) { console.error(err); alert('Failed to delete.'); }
    };

    const _origSwitch = window.switchAdminSection;
    window.switchAdminSection = function(sectionId) {
      _origSwitch(sectionId);
      if (sectionId === 'courses') window.loadCoursesList();
      if (sectionId === 'revenue') window.loadRevenueData();
    };
  