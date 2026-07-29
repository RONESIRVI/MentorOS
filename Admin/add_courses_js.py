import re

with open(r'R:\RONE_Studio\RONE_MentorOS\Admin\admin-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

courses_js = r"""
    // Show overview section on load
    window.switchAdminSection('overview');

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
    };
  </script>
</body>
</html>"""

# Replace the old ending
old_ending = "    // Show overview section on load\n    window.switchAdminSection('overview');\n  </script>\n</body>\n</html>"
new_content = content.replace(old_ending, courses_js)

if new_content == content:
    print("WARNING: Pattern not found! Checking endings...")
    print(repr(content[-300:]))
else:
    with open(r'R:\RONE_Studio\RONE_MentorOS\Admin\admin-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Done!")
