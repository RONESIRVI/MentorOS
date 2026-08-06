import re

with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Inject Premium CSS
premium_css = """
    /* Premium Dashboard Overhaul */
    .glass-card {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border-radius: 16px;
      padding: 24px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .glass-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
    }
    
    .premium-btn {
      background: linear-gradient(135deg, #3b82f6, #6366f1);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
      text-decoration: none;
    }
    .premium-btn:hover {
      background: linear-gradient(135deg, #2563eb, #4f46e5);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .badge-live { background: #dcfce7; color: #166534; }
    .badge-upcoming { background: #fef9c3; color: #854d0e; }
    
    .animated-progress {
      width: 100%;
      background: #f1f5f9;
      border-radius: 10px;
      height: 12px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
    }
    .animated-progress-bar {
      height: 100%;
      border-radius: 10px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
      transition: width 1.5s ease-out;
      position: relative;
    }
    .animated-progress-bar::after {
      content: "";
      position: absolute;
      top: 0; left: 0; bottom: 0; right: 0;
      background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .magazine-card {
      display: flex;
      gap: 20px;
      background: white;
      border-radius: 16px;
      padding: 20px;
      border: 1px solid #f1f5f9;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02);
      transition: all 0.3s ease;
    }
    .magazine-card:hover {
      border-color: #e2e8f0;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .mag-icon {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #ef4444;
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      flex-shrink: 0;
    }
"""

if "/* Premium Dashboard Overhaul */" not in html:
    html = html.replace('</style>', premium_css + '\n  </style>')

# 2. Re-write the sections with Premium UI
premium_sections = '''


        <!-- SECTION: REPORT CARD -->
        <div id="section-report" class="aspirant-section" style="display:none;">
          <div class="dash-header" style="margin-bottom: 30px;">
            <div class="page-title">
              <h2 style="margin: 0; font-size: 1.8rem; background: linear-gradient(90deg, #1e293b, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Performance Analytics</h2>
              <p style="color: #64748b; font-size: 1rem; margin-top: 5px;">Track your growth and identify weak areas.</p>
            </div>
          </div>
          <div class="content-grid">
            <div class="glass-card" style="background: linear-gradient(135deg, #ffffff, #f8fafc);">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: #eff6ff; color: #3b82f6; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">✍️</div>
                <h3 style="margin: 0; font-size: 1.2rem; color: #1e293b;">Answer Writing</h3>
              </div>
              
              <div style="margin-bottom: 24px;">
                <p style="font-size: 0.95rem; margin: 0 0 8px 0; display: flex; justify-content: space-between; color: #475569;">
                  <span>Average Quality Score</span>
                  <span style="font-weight: 700; color: #3b82f6;">5.5 / 10</span>
                </p>
                <div class="animated-progress">
                  <div class="animated-progress-bar" style="width: 55%; background: linear-gradient(90deg, #60a5fa, #3b82f6);"></div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                <div style="text-align: center;">
                  <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #10b981;">12</p>
                  <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Evaluated</p>
                </div>
                <div style="width: 1px; background: #e2e8f0;"></div>
                <div style="text-align: center;">
                  <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #f59e0b;">3</p>
                  <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Pending</p>
                </div>
              </div>
            </div>

            <div class="glass-card" style="background: linear-gradient(135deg, #ffffff, #f8fafc);">
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; border-radius: 10px; background: #f3e8ff; color: #a855f7; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">📝</div>
                <h3 style="margin: 0; font-size: 1.2rem; color: #1e293b;">Mock Tests</h3>
              </div>
              
              <div style="margin-bottom: 24px;">
                <p style="font-size: 0.95rem; margin: 0 0 8px 0; display: flex; justify-content: space-between; color: #475569;">
                  <span>Average Marks</span>
                  <span style="font-weight: 700; color: #a855f7;">42.5%</span>
                </p>
                <div class="animated-progress">
                  <div class="animated-progress-bar" style="width: 42.5%; background: linear-gradient(90deg, #c084fc, #a855f7);"></div>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; background: #fff; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9;">
                <div style="text-align: center;">
                  <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #3b82f6;">2</p>
                  <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Attempted</p>
                </div>
                <div style="width: 1px; background: #e2e8f0;"></div>
                <div style="text-align: center;">
                  <p style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #10b981;">Top 30%</p>
                  <p style="margin: 0; font-size: 0.8rem; color: #64748b;">Percentile</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- END SECTION: REPORT CARD -->

        <!-- SECTION: CURRENT AFFAIRS -->
        <div id="section-current-affairs" class="aspirant-section" style="display:none;">
          <div class="dash-header" style="margin-bottom: 30px;">
            <div class="page-title">
              <h2 style="margin: 0; font-size: 1.8rem; background: linear-gradient(90deg, #1e293b, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Current Affairs Hub</h2>
              <p style="color: #64748b; font-size: 1rem; margin-top: 5px;">Daily and monthly compilations curated by experts.</p>
            </div>
          </div>
          <div class="content-grid" style="grid-template-columns: 1fr;">
            
            <div class="magazine-card">
              <div class="mag-icon">📰</div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="badge" style="background: #e0e7ff; color: #4338ca; margin-bottom: 8px;">Monthly Compilation</span>
                    <h3 style="margin: 0 0 5px 0; font-size: 1.2rem; color: #1e293b;">July 2026 Complete Edition</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin: 0 0 15px 0;">Covers all major national, international, and economic events.</p>
                  </div>
                  <a href="#" onclick="alert('Downloading high-res PDF...')" class="premium-btn" style="padding: 8px 16px; border-radius: 20px;"><span style="font-size: 1.2rem;">⬇️</span> Download</a>
                </div>
              </div>
            </div>

            <div class="magazine-card">
              <div class="mag-icon" style="background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #3b82f6;">🗞️</div>
              <div style="flex: 1;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                  <div>
                    <span class="badge" style="background: #e0e7ff; color: #4338ca; margin-bottom: 8px;">Daily Digest</span>
                    <h3 style="margin: 0 0 5px 0; font-size: 1.2rem; color: #1e293b;">July 25, 2026 - Daily News</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin: 0 0 15px 0;">Key highlights from The Hindu and Indian Express.</p>
                  </div>
                  <a href="#" onclick="alert('Downloading high-res PDF...')" class="premium-btn" style="padding: 8px 16px; border-radius: 20px; background: linear-gradient(135deg, #64748b, #475569); box-shadow: 0 4px 15px rgba(100, 116, 139, 0.3);"><span style="font-size: 1.2rem;">⬇️</span> Download</a>
                </div>
              </div>
            </div>

          </div>
        </div>
        <!-- END SECTION: CURRENT AFFAIRS -->

        <!-- SECTION: AI STUDY PLANNER -->
        <div id="section-ai-planner" class="aspirant-section" style="display:none;">
          <div class="dash-header" style="margin-bottom: 30px;">
            <div class="page-title">
              <h2 style="margin: 0; font-size: 1.8rem; background: linear-gradient(90deg, #1e293b, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">AI Study Planner</h2>
              <p style="color: #64748b; font-size: 1rem; margin-top: 5px;">Let our algorithm build the perfect schedule for you.</p>
            </div>
          </div>
          
          <div class="glass-card" style="max-width: 700px; margin: 0 auto; background: linear-gradient(to bottom right, #1e293b, #0f172a); color: white; border: 1px solid #334155; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="font-size: 3rem; margin-bottom: 10px;">🤖✨</div>
              <h3 style="margin: 0 0 5px 0; font-size: 1.5rem; font-weight: 700;">Configure Your AI Assistant</h3>
              <p style="color: #94a3b8; font-size: 0.95rem; margin: 0;">Provide inputs to generate a highly personalized timetable.</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
              <div>
                <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">Target Exam</label>
                <select style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: white; font-family: inherit; font-size: 1rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#475569'">
                  <option>RAS Mains</option>
                  <option>UPSC Mains</option>
                  <option>RAS Prelims</option>
                </select>
              </div>
              <div>
                <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">Daily Available Hours</label>
                <input type="number" value="6" min="1" max="16" style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: white; font-family: inherit; font-size: 1rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#475569'">
              </div>
              <div style="grid-column: 1 / -1;">
                <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 8px; color: #cbd5e1;">Weak Subjects (Focus Areas)</label>
                <input type="text" placeholder="e.g., Public Administration, World History" style="width: 100%; padding: 12px; background: #1e293b; border: 1px solid #475569; border-radius: 8px; color: white; font-family: inherit; font-size: 1rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#3b82f6'" onblur="this.style.borderColor='#475569'">
              </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
              <button onclick="alert('AI is analyzing your profile... Timetable generation will be available soon!')" style="background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: white; border: none; padding: 14px 32px; border-radius: 30px; font-size: 1.1rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.4); transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 15px 35px rgba(139, 92, 246, 0.5)'" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 10px 25px rgba(139, 92, 246, 0.4)'">
                Generate Magic Plan ✨
              </button>
            </div>
          </div>
        </div>
        <!-- END SECTION: AI STUDY PLANNER -->
'''

# We need to replace the old sections with premium_sections
old_tests_start = html.find('<!-- SECTION: TEST SERIES -->')
old_ai_end = html.find('<!-- END SECTION: AI STUDY PLANNER -->') + len('<!-- END SECTION: AI STUDY PLANNER -->')

if old_tests_start != -1 and old_ai_end != -1:
    html = html[:old_tests_start] + premium_sections + html[old_ai_end:]

# 3. Remove "nav-answers" from sidebar
html = re.sub(r'<a href="#" class="sidebar-nav-item" id="nav-answers".*?</a>', '', html, flags=re.DOTALL)
# 4. Remove standalone "section-answers"
html = re.sub(r'<!-- SECTION: ANSWER WRITING -->.*?<!-- END SECTION: ANSWER WRITING -->', '', html, flags=re.DOTALL)

# 5. Inject Answer Upload form inside loadCoursesList for enrolled courses
old_js_line = "actionBtn = `<button disabled style=\"width:100%; padding:10px; background:#dcfce7; color:#166534; border:1px solid #166534; border-radius:6px; font-weight:600; cursor:not-allowed;\">✅ Enrolled</button>`;"
new_js_line = """
actionBtn = `
<button disabled style="width:100%; padding:10px; background:#dcfce7; color:#166534; border:1px solid #166534; border-radius:6px; font-weight:600; cursor:not-allowed; margin-bottom: 12px;">✅ Enrolled</button>
<!-- Premium Answer Upload Form -->
<div style="background: rgba(255,255,255,0.9); padding: 16px; border-radius: 12px; border: 1px dashed #cbd5e1; margin-top: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
  <h4 style="margin: 0 0 12px 0; font-size: 0.95rem; color: #1e293b; display: flex; align-items: center; gap: 6px;"><span>✍️</span> Submit Answer PDF</h4>
  <input type="text" id="ans-title-${id}" placeholder="e.g. GS 1 Full Length" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:10px; font-size:0.85rem; font-family: inherit; box-sizing: border-box;" autocomplete="off">
  <input type="url" id="ans-link-${id}" placeholder="Google Drive PDF Link" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:12px; font-size:0.85rem; font-family: inherit; box-sizing: border-box;" autocomplete="off">
  <button onclick="window.submitAnswerPremium('${id}', '${c.name.replace(/'/g, "\\'")}')" style="width:100%; padding:10px; background: linear-gradient(135deg, #3b82f6, #2563eb); color:white; border:none; border-radius:6px; font-weight:600; cursor:pointer; font-size:0.9rem; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">Submit for Evaluation</button>
</div>
`;
""".strip()
html = html.replace(old_js_line, new_js_line)

# 6. Add window.submitAnswerPremium function globally
premium_submit_js = """
      window.submitAnswerPremium = async function(courseId, courseName) {
        const title = document.getElementById('ans-title-' + courseId).value.trim();
        const link = document.getElementById('ans-link-' + courseId).value.trim();
        if(!title || !link) {
          alert('Please provide both the Title and the Google Drive Link.');
          return;
        }
        
        try {
          await addDoc(collection(db, 'evaluations'), {
            student: _currentUserEmail,
            title: title,
            link: link,
            courseId: courseId,
            courseName: courseName,
            status: 'Pending',
            score: null,
            feedback: '',
            submittedAt: new Date().toISOString()
          });
          alert('✅ Your answer PDF has been successfully submitted for evaluation!');
          document.getElementById('ans-title-' + courseId).value = '';
          document.getElementById('ans-link-' + courseId).value = '';
        } catch (e) {
          console.error(e);
          alert('❌ Error submitting answer. Please try again.');
        }
      };
"""
# inject right before window.loadCoursesList = async function() {
if "window.submitAnswerPremium = async function" not in html:
    html = html.replace("window.loadCoursesList = async function() {", premium_submit_js + "\n      window.loadCoursesList = async function() {")

with open('Aspirant/aspirant-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Premium UI injected and Answer Writing logic updated successfully.")
