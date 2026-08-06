import re

def main():
    with open('build_aspirant.py', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update the UI for File Upload (replace the GDrive text input)
    ui_old = r'<label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:#475569;">Answer PDF Link \(Google Drive\)</label>\s*<input type="url" id="ans-link" placeholder="Paste link here" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:16px;">'
    
    ui_new = r'''<label style="display:block; margin-bottom:6px; font-weight:600; font-size:0.85rem; color:#475569;">Answer PDF File</label>
              <input type="file" id="ans-file" accept="application/pdf" style="width:100%; padding:10px; border:1px solid #e2e8f0; border-radius:6px; margin-bottom:16px;">'''
    
    html = re.sub(ui_old, ui_new, html)

    # 2. Update Firebase Imports to include Storage
    import_old = r'import \{ getFirestore, doc, getDoc, collection, getDocs, setDoc, query, where \} from "https://www\.gstatic\.com/firebasejs/10\.7\.1/firebase-firestore\.js";'
    import_new = r'''import { getFirestore, doc, getDoc, collection, getDocs, setDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";'''
    
    html = re.sub(import_old, import_new, html)

    # 3. Initialize Storage
    init_old = r'const db = getFirestore\(app\);'
    init_new = r'''const db = getFirestore(app);
    const storage = getStorage(app);'''
    
    html = re.sub(init_old, init_new, html)

    # 4. Update window.submitAnswer function
    submit_old = r'''    window\.submitAnswer = async function\(\) \{\s*const title = document\.getElementById\('ans-title'\)\.value\.trim\(\);\s*const link = document\.getElementById\('ans-link'\)\.value\.trim\(\);\s*if\(!title \|\| !link\) \{ alert\('All fields are required'\); return; \}\s*const btn = document\.getElementById\('btn-submit-ans'\);\s*btn\.disabled = true; btn\.textContent = 'Submitting\.\.\.';\s*try \{\s*const docId = Date\.now\(\)\.toString\(\);\s*await setDoc\(doc\(db, 'evaluations', docId\), \{\s*studentName: _currentUserName \|\| _currentUserEmail\.split\('@'\)\[0\],\s*studentId: _currentUserEmail,\s*title: title,\s*link: link,\s*status: 'Pending',\s*timestamp: new Date\(\)\.toISOString\(\)\s*\}\);\s*alert\('Answer submitted for evaluation!'\);\s*document\.getElementById\('ans-title'\)\.value = '';\s*document\.getElementById\('ans-link'\)\.value = '';\s*window\.loadMyAnswers\(\);\s*\} catch \(err\) \{\s*console\.error\(err\);\s*alert\('Failed to submit answer\.'\);\s*\} finally \{\s*btn\.disabled = false; btn\.textContent = 'Submit for Evaluation';\s*\}\s*\};'''

    submit_new = r'''    window.submitAnswer = async function() {
      const title = document.getElementById('ans-title').value.trim();
      const fileInput = document.getElementById('ans-file');
      const file = fileInput.files[0];
      if(!title || !file) { alert('Title and PDF file are required'); return; }
      const btn = document.getElementById('btn-submit-ans');
      btn.disabled = true; btn.textContent = 'Uploading...';
      try {
        const docId = Date.now().toString();
        const storageRef = ref(storage, `evaluations/${docId}_${file.name}`);
        await uploadBytesResumable(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await setDoc(doc(db, 'evaluations', docId), {
          studentName: _currentUserName || _currentUserEmail.split('@')[0],
          studentId: _currentUserEmail,
          title: title,
          link: downloadURL,
          fileName: file.name,
          status: 'Pending',
          timestamp: new Date().toISOString()
        });
        alert('Answer submitted for evaluation!');
        document.getElementById('ans-title').value = '';
        fileInput.value = '';
        window.loadMyAnswers();
      } catch (err) {
        console.error(err);
        alert('Failed to submit answer.');
      } finally {
        btn.disabled = false; btn.textContent = 'Submit for Evaluation';
      }
    };'''
    
    html = re.sub(submit_old, submit_new, html)

    with open('build_aspirant.py', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    main()
    print("Done")
