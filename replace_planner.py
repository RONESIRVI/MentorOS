import re

def update_dashboard():
    with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update the sidebar navigation link
    sidebar_old = r'<a href="#" class="sidebar-nav-item" id="nav-planner" onclick="window\.switchAspirantSection\(\'planner\'\)">\s*<span class="icon">📅</span> Daily Planner\s*</a>'
    sidebar_new = r'''<a href="#" class="sidebar-nav-item" id="nav-answers" onclick="window.switchAspirantSection('answers')">
          <span class="icon">📝</span> Answer Writing
        </a>'''
    html = re.sub(sidebar_old, sidebar_new, html)

    # 2. Replace section-planner block with section-answers block
    planner_section_pattern = r'<!-- SECTION: DAILY PLANNER -->.*?<!-- END SECTION: DAILY PLANNER -->'
    
    answers_section = '''<!-- SECTION: ANSWER WRITING -->
        <div id="section-answers" class="aspirant-section" style="display:none;">
          <div class="dash-header">
            <div class="page-title">
              <h2 style="margin: 0; font-size: 1.8rem; background: linear-gradient(90deg, #1e293b, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Answer Writing 📝</h2>
              <p style="color: #64748b;">Submit your answer PDFs via Google Drive link for evaluation.</p>
            </div>
          </div>
          
          <div class="content-grid" style="grid-template-columns: 1fr;">
            <!-- Upload Form -->
            <div class="card" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px 0; font-size: 1.2rem; color: #0f172a; display: flex; align-items: center; gap: 8px;"><span>📤</span> Upload New Submission</h3>
              
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
                <div>
                  <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: 8px;">Submission Title *</label>
                  <input type="text" id="ans-title" placeholder="e.g. GS Paper 1 - Part A" style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;" autocomplete="off">
                </div>
                <div>
                  <label style="display: block; font-size: 0.9rem; font-weight: 600; color: #475569; margin-bottom: 8px;">Google Drive PDF Link *</label>
                  <input type="url" id="ans-link" placeholder="Paste viewable GDrive link here..." style="width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;" autocomplete="off">
                </div>
              </div>
              
              <button id="btn-submit-ans" onclick="window.submitAnswer()" style="padding: 12px 24px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: transform 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">Submit for Evaluation</button>
            </div>
            
            <!-- Past Submissions Table -->
            <div class="card" style="background: white; border-radius: 16px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
              <h3 style="margin: 0 0 16px 0; font-size: 1.2rem; color: #0f172a; display: flex; align-items: center; gap: 8px;"><span>📑</span> My Submissions</h3>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                  <thead>
                    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                      <th style="padding: 12px; font-size: 0.9rem; font-weight: 600; color: #475569;">Title & Link</th>
                      <th style="padding: 12px; font-size: 0.9rem; font-weight: 600; color: #475569;">Submitted On</th>
                      <th style="padding: 12px; font-size: 0.9rem; font-weight: 600; color: #475569;">Status</th>
                      <th style="padding: 12px; font-size: 0.9rem; font-weight: 600; color: #475569;">Score</th>
                      <th style="padding: 12px; font-size: 0.9rem; font-weight: 600; color: #475569;">Feedback</th>
                    </tr>
                  </thead>
                  <tbody id="answers-table-body">
                    <tr><td colspan="5" style="text-align: center; padding: 20px; color: #64748b;">Loading submissions...</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <!-- Top Stats Grid (Adapted for Answer Writing) -->
          <div class="stats-grid" style="margin-top: 24px; margin-bottom: 24px;">
            <div class="stat-card blue">
              <div class="stat-info">
                <h3 id="stat-ans-total">0</h3>
                <p>Total Submissions</p>
              </div>
              <div class="stat-icon">📑</div>
            </div>
            <div class="stat-card green">
              <div class="stat-info">
                <h3 id="stat-ans-eval">0</h3>
                <p>Evaluated</p>
              </div>
              <div class="stat-icon">✅</div>
            </div>
            <div class="stat-card amber">
              <div class="stat-info">
                <h3 id="stat-ans-pend">0</h3>
                <p>Pending</p>
              </div>
              <div class="stat-icon">⏳</div>
            </div>
          </div>
          
        </div>
        <!-- END SECTION: ANSWER WRITING -->'''
    
    html = re.sub(planner_section_pattern, answers_section, html, flags=re.DOTALL)

    # 3. Update loadMyAnswers JS to also populate the new stats
    js_load_my_answers_old = r'(const snap = await getDocs\(query\(collection\(db, \'evaluations\'\), where\(\'studentId\', \'==\', _currentUserEmail\)\)\);\s*let html = \'\';)'
    js_load_my_answers_new = r'''\1
        let total = 0, evald = 0, pend = 0;'''
    
    html = re.sub(js_load_my_answers_old, js_load_my_answers_new, html)

    js_load_my_answers_loop_old = r'(snap\.forEach\(d => \{\s*const ev = d\.data\(\);)'
    js_load_my_answers_loop_new = r'''\1
          total++;
          if(ev.status === 'Evaluated' || ev.status === 'Completed' || ev.status === 'Graded') evald++;
          else pend++;'''
    
    html = re.sub(js_load_my_answers_loop_old, js_load_my_answers_loop_new, html)

    js_load_my_answers_end_old = r'(tbody\.innerHTML = html \|\| \'<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748b;">No submissions yet\.</td></tr>\';)'
    js_load_my_answers_end_new = r'''\1
        if(document.getElementById('stat-ans-total')) document.getElementById('stat-ans-total').textContent = total;
        if(document.getElementById('stat-ans-eval')) document.getElementById('stat-ans-eval').textContent = evald;
        if(document.getElementById('stat-ans-pend')) document.getElementById('stat-ans-pend').textContent = pend;'''
    
    html = re.sub(js_load_my_answers_end_old, js_load_my_answers_end_new, html)


    with open('Aspirant/aspirant-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    update_dashboard()
    print("Done")
