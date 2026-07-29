
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
    import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
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
        // Enforce Aspirant Role
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
        
        if (role.toLowerCase() !== 'aspirant') {
          window.location.href = '../index.html';
          return;
        }

        // User logged in
        const email = user.email;
        const namePart = email.split('@')[0];
        const initial = namePart.charAt(0).toUpperCase();

        document.getElementById('welcome-message').textContent = `Welcome back, ${namePart}! 👋`;
        const topbarAvatar = document.getElementById('topbar-avatar');
        if (topbarAvatar) topbarAvatar.textContent = initial;

        // Start session inactivity timer (7 min idle → 3 min warning → logout)
        initSessionManager(auth, signOut, '../index.html');

        // Fetch Latest Planner
        fetchLatestPlanner();
        // Fetch Today's Dynamic Tasks
        fetchTodayTasks();
        // Fetch Syllabus Progress
        fetchProgress();
      } else {
        // Not logged in -> redirect to login
        window.location.href = '../index.html';
      }
    });



    const btnLogoutTop = document.getElementById('btnLogoutTop');
    if (btnLogoutTop) {
      btnLogoutTop.addEventListener('click', () => {
        signOut(auth).then(() => {
          window.location.href = '../index.html';
        });
      });
    }

    // Fetch Latest Planner directly from GitHub Repository
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

    // Fetch Today's Dynamic Tasks from JSON
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
        
        data.forEach(item => {
          if (item.task === 'REVISION') {
            if (item.revisions && item.revisions.length > 0) {
              item.revisions.forEach(rev => {
                hasTasks = true;
                taskList.innerHTML += `
                  <div class="task-item">
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
          // Handle everything else (CLASSES, Analysis, PYQ TEST, MOCK TEST, etc)
          else {
            hasTasks = true;
            let tagClass = 'tag-current';
            if (item.task.toLowerCase().includes('analysis') || item.task.toLowerCase().includes('test')) {
              tagClass = 'tag-writing';
            }
            
            taskList.innerHTML += `
              <div class="task-item">
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
        
        // NOW ADD PYQ TEST (derived from CLASSES) matching the email image logic
        data.forEach(item => {
          if (item.task && item.task.startsWith('CLASSES')) {
            if (item.subject && !item.subject.includes('[')) {
              hasTasks = true;
              taskList.innerHTML += `
                <div class="task-item">
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
            }
          }
        });

        // NOW ADD MOCK TEST (derived from REVISION, excluding Same Day Rev) matching the email image logic
        data.forEach(item => {
          if (item.task === 'REVISION' && item.revisions) {
            item.revisions.forEach(rev => {
              if (rev.topic && !rev.topic.includes('Same Day Rev')) {
                hasTasks = true;
                taskList.innerHTML += `
                  <div class="task-item">
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
        
        // Add click event for checkboxes
        document.querySelectorAll('.task-item').forEach(el => {
          el.addEventListener('click', function(e) {
            this.classList.toggle('completed');
            const checkbox = this.querySelector('.task-checkbox');
            checkbox.innerHTML = this.classList.contains('completed') ? '✓' : '';
          });
        });

      } catch (err) {
        console.error(err);
        taskList.innerHTML = '<p style="color: #ef4444; padding: 16px; text-align: center;">Failed to load tasks. Please check the planner image.</p>';
      }
    }

    // Fetch Dynamic Syllabus Progress from JSON
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

    
    // --- ASPIRANT SPA LOGIC & COURSES ---
    window.switchAspirantSection = function(sectionId) {
      document.querySelectorAll('.aspirant-section').forEach(sec => sec.style.display = 'none');
      const target = document.getElementById('section-' + sectionId);
      if (target) target.style.display = 'block';
      
      document.querySelectorAll('.sidebar-nav-item').forEach(nav => nav.classList.remove('active'));
      const activeNav = document.getElementById('nav-' + sectionId);
      if (activeNav) activeNav.classList.add('active');

      if (window.innerWidth <= 768) document.getElementById('sidebar').classList.remove('active');

      if (sectionId === 'courses') window.loadAspirantCourses();
    };

    let _currentUserEmail = null;

    // Attach to onAuthStateChanged to grab email
    const _origAuth = onAuthStateChanged;
    // Actually we just wait for the first auth state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        _currentUserEmail = user.email;
      }
    });

    window.loadAspirantCourses = async function() {
      const grid = document.getElementById('available-courses-grid');
      if (!grid) return;
      grid.innerHTML = '<p style="color:#64748b;">Loading available courses...</p>';
      
      try {
        const { collection, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const snapshot = await getDocs(collection(db, 'courses'));
        let html = '';
        
        snapshot.forEach(docSnap => {
          const c = docSnap.data();
          if(c.status !== 'Active') return; // Only show active courses
          
          html += `
            <div style="background:white;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);display:flex;flex-direction:column;">
              <div style="height:120px;background:linear-gradient(135deg, #1e293b, #0f172a);display:flex;align-items:center;justify-content:center;color:white;font-size:3rem;position:relative;">
                📚
                <div style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">${c.category || 'Course'}</div>
              </div>
              <div style="padding:20px;display:flex;flex-direction:column;flex:1;">
                <h3 style="margin:0 0 8px;font-size:1.1rem;font-weight:700;color:#0f172a;">${c.name}</h3>
                <p style="margin:0 0 16px;color:#64748b;font-size:0.85rem;flex:1;">${c.description || 'Premium mentorship program for UPSC/RPSC.'}</p>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                  <span style="font-size:1.25rem;font-weight:800;color:#10b981;">&#8377;${parseInt(c.fee||0).toLocaleString('en-IN')}</span>
                  <span style="font-size:0.8rem;color:#64748b;font-weight:600;">${c.seats ? c.seats+' Seats' : 'Unlimited'}</span>
                </div>
                <button onclick="window.openPaymentModal('${docSnap.id}', '${c.name.replace(/'/g, "\'")}', ${c.fee||0})" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background 0.2s;">Buy Now</button>
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
        const { setDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
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
        
        alert("✅ Payment Submitted!
Your UTR has been sent for verification. You will get course access once the Admin approves it.");
        window.closePaymentModal();
      } catch (err) {
        console.error(err);
        alert("❌ Failed to submit payment. Please try again.");
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Payment for Verification';
      }
    };


    // Mobile menu toggle
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    
    mobileBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && e.target !== mobileBtn) {
          sidebar.classList.remove('active');
        }
      }
    });

    // GitHub Sync Logic
    const syncBtn = document.getElementById('syncDataBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        let token = localStorage.getItem('github_pat');
        
        if (!token) {
          token = prompt("Please enter your GitHub Personal Access Token (PAT) with 'repo' scope to sync data directly from GitHub Actions:\n\nIf you don't have one, generate it at https://github.com/settings/tokens");
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
            alert("✅ Sync started successfully!\n\nThe backend script is now pulling data from your Excel sheet.\nPlease wait about 1-2 minutes and then refresh this page to see the updated Planner and Progress.");
          } else {
            const errData = await response.json();
            alert(`❌ Failed to start sync.\nError: ${errData.message || response.statusText}\n\nYour Token might be invalid or expired. I've cleared it, please try clicking Sync again with a valid token.`);
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
  