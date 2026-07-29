import re

with open(r'R:\RONE_Studio\RONE_MentorOS\Admin\admin-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# ─── NEW REVENUE SECTION HTML ────────────────────────────────────────────────
revenue_html = """        <!-- SECTION: REVENUE -->
        <div id="section-revenue" class="admin-section" style="display:none;">

          <!-- Transaction Modal -->
          <div id="txn-modal" style="display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);align-items:center;justify-content:center;">
            <div style="background:white;border-radius:20px;padding:36px;width:95%;max-width:520px;box-shadow:0 25px 60px rgba(0,0,0,0.2);position:relative;max-height:90vh;overflow-y:auto;">
              <button onclick="closeTxnModal()" style="position:absolute;top:16px;right:16px;background:#f1f5f9;border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;">X</button>
              <h2 id="txn-modal-title" style="margin:0 0 24px;font-size:1.25rem;font-weight:700;color:#0f172a;">+ Add Transaction</h2>
              <div style="display:grid;gap:14px;">
                <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Student Name / ID *</label><input id="tf-student" type="text" placeholder="e.g. Rahul Sharma / RS001" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;box-sizing:border-box;"></div>
                <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Course *</label><input id="tf-course" type="text" placeholder="e.g. UPSC CSE Foundation 2026" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;box-sizing:border-box;"></div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                  <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Amount (Rs.) *</label><input id="tf-amount" type="number" placeholder="12000" min="0" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;box-sizing:border-box;"></div>
                  <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Date *</label><input id="tf-date" type="date" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;box-sizing:border-box;"></div>
                </div>
                <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Payment Mode</label><select id="tf-mode" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;background:white;cursor:pointer;"><option value="UPI">UPI</option><option value="Bank Transfer">Bank Transfer</option><option value="Cash">Cash</option><option value="Card">Card / Online</option><option value="Cheque">Cheque</option></select></div>
                <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Status</label><select id="tf-status" style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;background:white;cursor:pointer;"><option value="Paid">Paid</option><option value="Pending">Pending</option><option value="Partial">Partial</option><option value="Refunded">Refunded</option></select></div>
                <div><label style="font-size:0.85rem;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Notes</label><textarea id="tf-notes" rows="2" placeholder="Any notes..." style="width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.95rem;outline:none;resize:vertical;box-sizing:border-box;"></textarea></div>
              </div>
              <div style="display:flex;gap:12px;margin-top:24px;">
                <button onclick="closeTxnModal()" style="flex:1;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;background:white;cursor:pointer;font-weight:600;color:#64748b;">Cancel</button>
                <button onclick="window.saveTxn()" style="flex:2;padding:12px;border:none;border-radius:10px;background:linear-gradient(135deg,#10b981,#059669);color:white;cursor:pointer;font-weight:700;font-size:0.95rem;">Save Transaction</button>
              </div>
              <input type="hidden" id="tf-edit-id">
            </div>
          </div>

          <!-- Header -->
          <div class="dash-header" style="margin-bottom:24px;">
            <div class="welcome-text"><h1>Revenue &amp; Sales &#x1F4B3;</h1><p>Track all payments, pending fees, and monthly revenue in real-time.</p></div>
            <button onclick="openAddTxnModal()" style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:10px 20px;border-radius:10px;border:none;cursor:pointer;font-weight:700;font-size:0.95rem;box-shadow:0 4px 12px rgba(16,185,129,0.3);">+ Add Transaction</button>
          </div>

          <!-- Stats Cards -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:28px;">
            <div style="background:linear-gradient(135deg,#1a1f5e,#2d3481);border-radius:16px;padding:22px;color:white;position:relative;overflow:hidden;">
              <div style="font-size:0.85rem;opacity:0.8;margin-bottom:8px;font-weight:500;">Total Revenue</div>
              <div style="font-size:2rem;font-weight:700;font-family:'Space Grotesk',sans-serif;" id="rev-total">--</div>
              <div style="font-size:0.8rem;opacity:0.7;margin-top:4px;">All Time</div>
              <div style="position:absolute;right:-10px;bottom:-10px;font-size:5rem;opacity:0.07;">&#x1F4B0;</div>
            </div>
            <div style="background:linear-gradient(135deg,#10b981,#059669);border-radius:16px;padding:22px;color:white;position:relative;overflow:hidden;">
              <div style="font-size:0.85rem;opacity:0.8;margin-bottom:8px;font-weight:500;">This Month</div>
              <div style="font-size:2rem;font-weight:700;font-family:'Space Grotesk',sans-serif;" id="rev-month">--</div>
              <div style="font-size:0.8rem;opacity:0.7;margin-top:4px;" id="rev-month-label">Loading...</div>
              <div style="position:absolute;right:-10px;bottom:-10px;font-size:5rem;opacity:0.07;">&#x1F4C8;</div>
            </div>
            <div style="background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:16px;padding:22px;color:white;position:relative;overflow:hidden;">
              <div style="font-size:0.85rem;opacity:0.8;margin-bottom:8px;font-weight:500;">Pending</div>
              <div style="font-size:2rem;font-weight:700;font-family:'Space Grotesk',sans-serif;" id="rev-pending">--</div>
              <div style="font-size:0.8rem;opacity:0.7;margin-top:4px;" id="rev-pending-count">-- transactions</div>
              <div style="position:absolute;right:-10px;bottom:-10px;font-size:5rem;opacity:0.07;">&#x23F3;</div>
            </div>
            <div style="background:linear-gradient(135deg,#6366f1,#4f46e5);border-radius:16px;padding:22px;color:white;position:relative;overflow:hidden;">
              <div style="font-size:0.85rem;opacity:0.8;margin-bottom:8px;font-weight:500;">Transactions</div>
              <div style="font-size:2rem;font-weight:700;font-family:'Space Grotesk',sans-serif;" id="rev-count">--</div>
              <div style="font-size:0.8rem;opacity:0.7;margin-top:4px;">Total Entries</div>
              <div style="position:absolute;right:-10px;bottom:-10px;font-size:5rem;opacity:0.07;">&#x1F4CB;</div>
            </div>
          </div>

          <!-- Monthly Bar Chart -->
          <div class="panel" style="margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
              <h2 class="panel-title">Monthly Revenue (Last 6 Months)</h2>
            </div>
            <div id="rev-chart" style="display:flex;align-items:flex-end;gap:12px;height:160px;padding:0 8px;">
              <div style="color:#64748b;font-size:0.9rem;">Loading chart...</div>
            </div>
            <div id="rev-chart-labels" style="display:flex;gap:12px;padding:8px 8px 0;"></div>
          </div>

          <!-- Transactions Table -->
          <div class="panel">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
              <h2 class="panel-title">All Transactions</h2>
              <div style="display:flex;gap:8px;">
                <select id="txn-filter-status" onchange="window.filterTransactions()" style="padding:6px 12px;border:1px solid #e2e8f0;border-radius:6px;font-size:0.85rem;background:white;cursor:pointer;">
                  <option value="">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                  <option value="Refunded">Refunded</option>
                </select>
                <button onclick="window.loadRevenueData()" style="background:#f1f5f9;border:1px solid #e2e8f0;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:600;">Refresh</button>
              </div>
            </div>
            <div class="table-container">
              <table style="width:100%;border-collapse:collapse;min-width:700px;">
                <thead>
                  <tr style="text-align:left;border-bottom:2px solid #e2e8f0;">
                    <th style="padding:12px;font-weight:600;color:#64748b;">Student</th>
                    <th style="padding:12px;font-weight:600;color:#64748b;">Course</th>
                    <th style="padding:12px;font-weight:600;color:#64748b;">Amount</th>
                    <th style="padding:12px;font-weight:600;color:#64748b;">Mode</th>
                    <th style="padding:12px;font-weight:600;color:#64748b;">Date</th>
                    <th style="padding:12px;font-weight:600;color:#64748b;">Status</th>
                    <th style="padding:12px;font-weight:600;color:#64748b;text-align:right;">Actions</th>
                  </tr>
                </thead>
                <tbody id="txn-table-body">
                  <tr><td colspan="7" style="padding:30px;text-align:center;color:#64748b;">Loading transactions...</td></tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
        <!-- END SECTION: REVENUE -->"""

# ─── NEW REVENUE JS LOGIC ────────────────────────────────────────────────────
revenue_js = """
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
          + '<button onclick="window.openEditTxnModal(\''+t.id+'\')" style="padding:5px 10px;font-size:0.8rem;border-radius:6px;border:1px solid #e2e8f0;background:white;cursor:pointer;font-weight:600;margin-right:5px;color:#475569;">Edit</button>'
          + '<button onclick="window.deleteTxn(\''+t.id+'\')" style="padding:5px 10px;font-size:0.8rem;border-radius:6px;border:1px solid #fee2e2;background:#fff5f5;cursor:pointer;font-weight:600;color:#ef4444;">Del</button>'
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

    window.deleteTxn = async function(txnId) {
      if (!confirm('Delete this transaction? This cannot be undone!')) return;
      try {
        const { deleteDoc: dd } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        await dd(doc(db, 'transactions', txnId));
        alert('Deleted!');
        window.loadRevenueData();
      } catch (err) { console.error(err); alert('Failed to delete.'); }
    };
"""

# Replace the Revenue section
old_section = """        <!-- SECTION: REVENUE -->
        <div id="section-revenue" class="admin-section" style="display:none;">
          <div class="dash-header"><div class="welcome-text"><h1>Revenue &amp; Sales \U0001f4b3</h1><p>Module coming soon \u2014 full analytics dashboard in progress.</p></div></div>
        </div>
        <!-- END SECTION: REVENUE -->"""

# Find and replace revenue section
start_marker = '        <!-- SECTION: REVENUE -->'
end_marker = '        <!-- END SECTION: REVENUE -->'
start_idx = content.find(start_marker)
end_idx = content.find(end_marker) + len(end_marker)

if start_idx == -1:
    print("ERROR: Revenue section start marker not found!")
else:
    content = content[:start_idx] + revenue_html + content[end_idx:]
    print("Revenue HTML replaced!")

# Inject Revenue JS before closing script tag
old_js_end = "    // Show overview section on load\n    window.switchAdminSection('overview');\n\n    // COURSES"
new_js_end = "    // Show overview section on load\n    window.switchAdminSection('overview');\n" + revenue_js + "\n    // COURSES"
content = content.replace(old_js_end, new_js_end)

# Also hook into switchAdminSection override for revenue
old_switch_hook = "    const _origSwitch = window.switchAdminSection;\n    window.switchAdminSection = function(sectionId) {\n      _origSwitch(sectionId);\n      if (sectionId === 'courses') window.loadCoursesList();\n    };"
new_switch_hook = "    const _origSwitch = window.switchAdminSection;\n    window.switchAdminSection = function(sectionId) {\n      _origSwitch(sectionId);\n      if (sectionId === 'courses') window.loadCoursesList();\n      if (sectionId === 'revenue') window.loadRevenueData();\n    };"
content = content.replace(old_switch_hook, new_switch_hook)

with open(r'R:\RONE_Studio\RONE_MentorOS\Admin\admin-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done! Revenue & Sales section built successfully.")
