import re

with open(r'R:\RONE_Studio\RONE_MentorOS\Aspirant\aspirant-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Modify Sidebar Nav Items
nav_updates = {
    '<a href="#" class="sidebar-nav-item active">': '<a href="#" class="sidebar-nav-item active" id="nav-home" onclick="switchAspirantSection(\'home\')">',
    '<a href="#" class="sidebar-nav-item">\n          <span class="icon">📚</span> My Courses': '<a href="#" class="sidebar-nav-item" id="nav-courses" onclick="switchAspirantSection(\'courses\')">\n          <span class="icon">📚</span> Courses & Payments'
}
for old, new in nav_updates.items():
    content = content.replace(old, new)

# 2. Wrap existing dashboard canvas in section-home
home_start_marker = '<!-- Header Section -->'
home_start_idx = content.find(home_start_marker)

# We need to wrap from Header Section to the end of .dashboard-canvas
home_end_marker = '<!-- End Dashboard Canvas -->'
# Find where dashboard-canvas ends? Wait, I can just inject closing tag before `<script>` ? 
# No, `<div class="dashboard-canvas">` is the container.
# Let's inject `<div id="section-home" class="aspirant-section">` right after `<div class="dashboard-canvas">`
content = content.replace(
    '<div class="dashboard-canvas">',
    '<div class="dashboard-canvas">\n        <!-- SECTION: HOME -->\n        <div id="section-home" class="aspirant-section">'
)

# And close it right before `</main>`
content = content.replace(
    '    </main>',
    '        </div>\n        <!-- END SECTION: HOME -->\n\n' + 
    '        <!-- SECTION: COURSES (PAYMENT GATEWAY) -->\n' + 
    '        <div id="section-courses" class="aspirant-section" style="display:none;">\n' +
    '          <div class="dash-header"><div class="welcome-text"><h1>Explore Courses 📚</h1><p>Enroll in premium courses with our manual UPI payment system.</p></div></div>\n' +
    '          \n' +
    '          <!-- Payment Modal -->\n' +
    '          <div id="payment-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);align-items:center;justify-content:center;">\n' +
    '            <div style="background:white;border-radius:20px;padding:32px;width:90%;max-width:400px;text-align:center;position:relative;box-shadow:0 25px 50px rgba(0,0,0,0.25);">\n' +
    '              <button onclick="closePaymentModal()" style="position:absolute;top:16px;right:16px;background:#f1f5f9;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-weight:bold;">X</button>\n' +
    '              <h2 style="margin:0 0 8px;font-size:1.3rem;font-weight:700;">Complete Payment</h2>\n' +
    '              <p style="color:#64748b;font-size:0.9rem;margin:0 0 20px;">Scan the QR code below using any UPI app (GPay, PhonePe, Paytm)</p>\n' +
    '              \n' +
    '              <div style="background:#f8fafc;padding:20px;border-radius:16px;border:2px dashed #cbd5e1;margin-bottom:20px;">\n' +
    '                 <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=ronesirvi@upi&pn=RONE%20MentorOS" alt="UPI QR" style="width:180px;height:180px;border-radius:12px;margin:0 auto;display:block;">\n' +
    '                 <p style="font-weight:700;margin:12px 0 0;font-size:1.1rem;color:#1e293b;">UPI ID: admin@upi</p>\n' +
    '                 <p style="font-weight:700;color:#10b981;font-size:1.2rem;margin:8px 0 0;" id="pay-amount-display">₹--</p>\n' +
    '              </div>\n' +
    '              \n' +
    '              <div style="text-align:left;">\n' +
    '                <label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Enter UTR / Reference No. *</label>\n' +
    '                <input type="text" id="pay-utr" placeholder="e.g. 312345678901" style="width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:1rem;margin-bottom:16px;box-sizing:border-box;outline:none;">\n' +
    '              </div>\n' +
    '              \n' +
    '              <input type="hidden" id="pay-course-id">\n' +
    '              <input type="hidden" id="pay-course-name">\n' +
    '              <input type="hidden" id="pay-course-fee">\n' +
    '              \n' +
    '              <button onclick="submitPayment()" id="btn-submit-payment" style="width:100%;padding:14px;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:10px;font-weight:700;font-size:1rem;cursor:pointer;">Submit Payment for Verification</button>\n' +
    '            </div>\n' +
    '          </div>\n' +
    '          \n' +
    '          <div id="available-courses-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;">\n' +
    '            <p style="color:#64748b;">Loading available courses...</p>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <!-- END SECTION: COURSES -->\n' +
    '      </div>\n' +
    '    </main>'
)

# 3. Inject Javascript logic for courses and section switching
js_logic = """
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
                <button onclick="window.openPaymentModal('${docSnap.id}', '${c.name.replace(/'/g, "\\'")}', ${c.fee||0})" style="width:100%;padding:12px;background:#3b82f6;color:white;border:none;border-radius:8px;font-weight:600;cursor:pointer;transition:background 0.2s;">Buy Now</button>
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
        
        alert("✅ Payment Submitted!\nYour UTR has been sent for verification. You will get course access once the Admin approves it.");
        window.closePaymentModal();
      } catch (err) {
        console.error(err);
        alert("❌ Failed to submit payment. Please try again.");
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Payment for Verification';
      }
    };
"""

content = content.replace(
    '// Mobile menu toggle',
    js_logic + '\n\n    // Mobile menu toggle'
)

with open(r'R:\RONE_Studio\RONE_MentorOS\Aspirant\aspirant-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Done!")
