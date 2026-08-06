import re

with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. COURSES Section
courses_stats = """
        <!-- Top Stats Grid -->
        <div class="stats-grid" style="margin-bottom: 24px;">
          <div class="stat-card blue">
            <div class="stat-info">
              <h3>8</h3>
              <p>Total Courses</p>
            </div>
            <div class="stat-icon">📚</div>
          </div>
          <div class="stat-card green">
            <div class="stat-info">
              <h3 id="stat-active-courses">0</h3>
              <p>Active Enrollments</p>
            </div>
            <div class="stat-icon">✅</div>
          </div>
          <div class="stat-card amber">
            <div class="stat-info">
              <h3 id="stat-pending-courses">0</h3>
              <p>Pending Verification</p>
            </div>
            <div class="stat-icon">⏳</div>
          </div>
        </div>
"""

# Replace in Courses
if "<!-- Top Stats Grid -->" not in html.split('id="section-courses"')[1].split('id="available-courses-grid"')[0]:
    # Insert right after <div class="dash-header"> ... </div> \n
    # Need to match the end of dash-header inside section-courses
    courses_pattern = r'(<div id="section-courses"[^>]*>.*?</div>\s*</div>)'
    def repl_courses(m):
        return m.group(1) + "\n" + courses_stats
    html = re.sub(courses_pattern, repl_courses, html, count=1, flags=re.DOTALL)


# 2. PLANNER Section
planner_stats = """
          <!-- Top Stats Grid -->
          <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card blue">
              <div class="stat-info">
                <h3>12</h3>
                <p>Tasks Today</p>
              </div>
              <div class="stat-icon">🎯</div>
            </div>
            <div class="stat-card green">
              <div class="stat-info">
                <h3>8</h3>
                <p>Tasks Completed</p>
              </div>
              <div class="stat-icon">✅</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-info">
                <h3>4</h3>
                <p>Tasks Pending</p>
              </div>
              <div class="stat-icon">⏱️</div>
            </div>
          </div>
"""
# planner header is:
#         <div id="section-planner" class="aspirant-section" style="display:none;">
#           <div class="dash-header">
#             <div class="page-title">
#               <h2 style="margin: 0;">Daily Planner</h2>
#               <p style="color: #64748b;">Your scheduled tasks and action plan for today.</p>
#             </div>
#           </div>
planner_pattern = r'(<div id="section-planner"[^>]*>\s*<div class="dash-header"[^>]*>.*?</div>\s*</div>\s*</div>)'
if "Tasks Today" not in html.split('id="section-planner"')[1].split('id="section-tests"')[0]:
    html = re.sub(planner_pattern, r'\1\n' + planner_stats, html, count=1, flags=re.DOTALL)


# 3. TESTS Section
tests_stats = """
          <!-- Top Stats Grid -->
          <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card blue">
              <div class="stat-info">
                <h3>24</h3>
                <p>Total Mock Tests</p>
              </div>
              <div class="stat-icon">📑</div>
            </div>
            <div class="stat-card green">
              <div class="stat-info">
                <h3>2</h3>
                <p>Tests Attempted</p>
              </div>
              <div class="stat-icon">✅</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-info">
                <h3>115</h3>
                <p>Average Marks</p>
              </div>
              <div class="stat-icon">📈</div>
            </div>
          </div>
"""
tests_pattern = r'(<div id="section-tests"[^>]*>\s*<div class="dash-header"[^>]*>.*?</div>\s*</div>)'
if "Total Mock Tests" not in html.split('id="section-tests"')[1].split('id="section-report"')[0]:
    html = re.sub(tests_pattern, r'\1\n' + tests_stats, html, count=1, flags=re.DOTALL)


# 4. REPORT Section
report_stats = """
          <!-- Top Stats Grid -->
          <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card blue">
              <div class="stat-info">
                <h3>12</h3>
                <p>Answers Evaluated</p>
              </div>
              <div class="stat-icon">📝</div>
            </div>
            <div class="stat-card amber">
              <div class="stat-info">
                <h3>3</h3>
                <p>Pending Review</p>
              </div>
              <div class="stat-icon">⏳</div>
            </div>
            <div class="stat-card green">
              <div class="stat-info">
                <h3>5.5 / 10</h3>
                <p>Avg Quality Score</p>
              </div>
              <div class="stat-icon">⭐</div>
            </div>
          </div>
"""
report_pattern = r'(<div id="section-report"[^>]*>\s*<div class="dash-header"[^>]*>.*?</div>\s*</div>)'
if "Answers Evaluated" not in html.split('id="section-report"')[1].split('id="section-current-affairs"')[0]:
    html = re.sub(report_pattern, r'\1\n' + report_stats, html, count=1, flags=re.DOTALL)


# 5. CURRENT AFFAIRS Section
ca_stats = """
          <!-- Top Stats Grid -->
          <div class="stats-grid" style="margin-bottom: 24px;">
            <div class="stat-card blue">
              <div class="stat-info">
                <h3>312</h3>
                <p>Daily News PDFs</p>
              </div>
              <div class="stat-icon">🗞️</div>
            </div>
            <div class="stat-card purple">
              <div class="stat-info">
                <h3>12</h3>
                <p>Monthly Compilations</p>
              </div>
              <div class="stat-icon">📚</div>
            </div>
            <div class="stat-card amber">
              <div class="stat-info">
                <h3>4</h3>
                <p>Unread PDFs</p>
              </div>
              <div class="stat-icon">📥</div>
            </div>
          </div>
"""
ca_pattern = r'(<div id="section-current-affairs"[^>]*>\s*<div class="dash-header"[^>]*>.*?</div>\s*</div>)'
if "Daily News PDFs" not in html.split('id="section-current-affairs"')[1].split('id="section-ai-planner"')[0]:
    html = re.sub(ca_pattern, r'\1\n' + ca_stats, html, count=1, flags=re.DOTALL)


with open('Aspirant/aspirant-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("Successfully injected stats-grid to all sections.")
