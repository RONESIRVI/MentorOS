import re

with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

new_sections = '''
        <!-- SECTION: DAILY PLANNER -->
        <div id="section-planner" class="aspirant-section" style="display:none;">
          <div class="dash-header">
            <div class="page-title">
              <h2 style="margin: 0;">Daily Planner</h2>
              <p style="color: #64748b;">Your scheduled tasks and action plan for today.</p>
            </div>
          </div>
          
          <div class="content-grid">
            <!-- Planner Image -->
            <div class="card planner-card">
              <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 style="margin: 0; font-size: 1.1rem;">Latest Planner Update</h3>
                <span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">From GitHub</span>
              </div>
              <div id="plannerContainer" style="margin-top: 16px;">
                <p style="color: #64748b; font-size: 0.9rem;">Loading planner image...</p>
              </div>
            </div>

            <!-- Today's Action Plan -->
            <div class="card">
              <div class="card-header">
                <h3 style="margin: 0; font-size: 1.1rem;">Today's Action Plan</h3>
              </div>
              <div class="task-list" id="todayTasksContainer">
                <p style="color: #64748b; font-size: 0.9rem;">Loading tasks...</p>
              </div>
            </div>
          </div>
        </div>
        <!-- END SECTION: DAILY PLANNER -->

        <!-- SECTION: REPORT CARD -->
        <div id="section-report" class="aspirant-section" style="display:none;">
          <div class="dash-header">
            <div class="page-title">
              <h2 style="margin: 0;">Report Card</h2>
              <p style="color: #64748b;">Track your performance in Answer Writing and Tests.</p>
            </div>
          </div>
          <div class="content-grid">
            <div class="card">
              <h3 style="margin-top: 0;">Answer Writing Performance</h3>
              <div style="margin-top: 15px;">
                <p style="font-size: 0.9rem; margin-bottom: 5px; display: flex; justify-content: space-between;">
                  <span>Average Score</span>
                  <span style="font-weight: bold; color: #3b82f6;">5.5 / 10</span>
                </p>
                <div style="width: 100%; background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="width: 55%; background: #3b82f6; height: 100%;"></div>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <p style="font-size: 0.9rem; margin-bottom: 5px; display: flex; justify-content: space-between;">
                  <span>Answers Evaluated</span>
                  <span style="font-weight: bold; color: #10b981;">12</span>
                </p>
              </div>
            </div>
            <div class="card">
              <h3 style="margin-top: 0;">Test Series Performance</h3>
              <div style="margin-top: 15px;">
                <p style="font-size: 0.9rem; margin-bottom: 5px; display: flex; justify-content: space-between;">
                  <span>Average Marks</span>
                  <span style="font-weight: bold; color: #8b5cf6;">85 / 200</span>
                </p>
                <div style="width: 100%; background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="width: 42.5%; background: #8b5cf6; height: 100%;"></div>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <p style="font-size: 0.9rem; margin-bottom: 5px; display: flex; justify-content: space-between;">
                  <span>Tests Attempted</span>
                  <span style="font-weight: bold; color: #f59e0b;">2</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        <!-- END SECTION: REPORT CARD -->

        <!-- SECTION: CURRENT AFFAIRS -->
        <div id="section-current-affairs" class="aspirant-section" style="display:none;">
          <div class="dash-header">
            <div class="page-title">
              <h2 style="margin: 0;">Current Affairs</h2>
              <p style="color: #64748b;">Daily PDFs and Monthly Compilations.</p>
            </div>
          </div>
          <div class="content-grid">
            <div class="card">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #fee2e2; color: #ef4444; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                  📄
                </div>
                <div>
                  <h3 style="margin: 0 0 5px 0;">July 2026 Monthly Compilation</h3>
                  <p style="color: #64748b; font-size: 0.85rem; margin: 0 0 10px 0;">Uploaded: July 1, 2026</p>
                  <a href="#" onclick="alert('PDF Download will start')" style="color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 0.9rem;">Download PDF ↓</a>
                </div>
              </div>
            </div>
            <div class="card">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="background: #fee2e2; color: #ef4444; width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">
                  📄
                </div>
                <div>
                  <h3 style="margin: 0 0 5px 0;">July 25 Daily News</h3>
                  <p style="color: #64748b; font-size: 0.85rem; margin: 0 0 10px 0;">Uploaded: July 25, 2026</p>
                  <a href="#" onclick="alert('PDF Download will start')" style="color: #3b82f6; text-decoration: none; font-weight: 500; font-size: 0.9rem;">Download PDF ↓</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- END SECTION: CURRENT AFFAIRS -->

        <!-- SECTION: AI STUDY PLANNER -->
        <div id="section-ai-planner" class="aspirant-section" style="display:none;">
          <div class="dash-header">
            <div class="page-title">
              <h2 style="margin: 0;">AI Study Planner</h2>
              <p style="color: #64748b;">Generate a personalized weekly timetable based on your goals.</p>
            </div>
          </div>
          <div class="card">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; max-width: 600px;">
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.9rem; margin-bottom: 5px; color: #334155;">Target Exam</label>
                <select style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit;">
                  <option>RAS Mains</option>
                  <option>UPSC Mains</option>
                  <option>RAS Prelims</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-weight: 500; font-size: 0.9rem; margin-bottom: 5px; color: #334155;">Daily Available Hours</label>
                <input type="number" value="6" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; box-sizing: border-box;">
              </div>
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 500; font-size: 0.9rem; margin-bottom: 5px; color: #334155;">Weak Subjects (Focus Areas)</label>
                <input type="text" placeholder="e.g., Public Administration, Ethics" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; box-sizing: border-box;">
              </div>
            </div>
            <div style="margin-top: 20px;">
              <button onclick="alert('AI Planner logic will generate timetable here based on your inputs.')" style="background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; border: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                ✨ Generate AI Plan
              </button>
            </div>
          </div>
        </div>
        <!-- END SECTION: AI STUDY PLANNER -->
'''

if 'id="section-tests"' not in html:
    html = html.replace('<!-- END SECTION: ANSWER WRITING -->', '<!-- END SECTION: ANSWER WRITING -->\n' + new_sections)

# Also remove planner HTML from section-home
home_section_start = html.find('<!-- SECTION: HOME -->')
home_section_end = html.find('<!-- SECTION: COURSES -->')

if home_section_start != -1 and home_section_end != -1:
    home_html = html[home_section_start:home_section_end]
    # Strip out planner container and todayTasksContainer from home_html
    home_html_new = re.sub(r'<!-- Planner Image -->.*?</div>\s*</div>', '', home_html, flags=re.DOTALL)
    home_html_new = re.sub(r'<!-- Today\'s Action Plan -->.*?</div>\s*</div>', '', home_html_new, flags=re.DOTALL)
    html = html.replace(home_html, home_html_new)

with open('Aspirant/aspirant-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)
print('HTML appended successfully.')
