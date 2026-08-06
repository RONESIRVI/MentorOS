import re

def main():
    with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Remove Firebase Storage Import
    storage_import = r'\s*import \{ getStorage, ref, uploadBytesResumable, getDownloadURL \} from "https://www\.gstatic\.com/firebasejs/10\.7\.1/firebase-storage\.js";'
    html = re.sub(storage_import, '', html)

    # 2. Remove Storage Init
    storage_init = r'\s*const storage = getStorage\(app\);'
    html = re.sub(storage_init, '', html)

    # 3. Update window.submitAnswer to use Google Apps Script
    submit_old = r'''    window\.submitAnswer = async function\(\) \{.*?(?=window\.loadMyAnswers = async function)'''
    
    script_url = "https://script.google.com/macros/s/AKfycbwIV4Nt5t9ZMsJgyvcCa-V4UfhMNToZ5fQZe-AJutNLUaAUvAVnMMQA4XrOR1FdoeI_bw/exec"
    
    submit_new = f'''    window.submitAnswer = async function() {{
      const title = document.getElementById('ans-title').value.trim();
      const fileInput = document.getElementById('ans-file');
      
      if(!title || !fileInput.files.length) {{ alert('Please provide a title and select a PDF file.'); return; }}
      
      const file = fileInput.files[0];
      if(file.type !== 'application/pdf') {{ alert('Only PDF files are allowed.'); return; }}
      if(file.size > 15 * 1024 * 1024) {{ alert('File size must be less than 15MB.'); return; }}

      const btn = document.getElementById('btn-submit-ans');
      const progressContainer = document.getElementById('upload-progress-container');
      const progressBar = document.getElementById('upload-bar');
      const progressPercent = document.getElementById('upload-percent');

      btn.disabled = true; 
      btn.textContent = 'Uploading to Google Drive...';
      progressContainer.style.display = 'block';
      progressBar.style.width = '30%';
      progressPercent.textContent = 'Processing file...';
      
      try {{
        // Read file as Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async function() {{
          const base64Data = reader.result.split(',')[1];
          
          progressBar.style.width = '60%';
          progressPercent.textContent = 'Sending to Drive...';
          
          const scriptURL = "{script_url}";
          
          const formData = new URLSearchParams();
          formData.append('fileData', base64Data);
          formData.append('mimeType', file.type);
          formData.append('fileName', file.name);
          formData.append('studentName', _currentUserName || _currentUserEmail.split('@')[0]);
          formData.append('courseName', title);

          try {{
            const response = await fetch(scriptURL, {{
              method: 'POST',
              body: formData
            }});
            
            const result = await response.json();
            
            if(result.status === "success") {{
              progressBar.style.width = '100%';
              progressPercent.textContent = '100%';
              
              // Save to Firestore
              const docId = Date.now().toString();
              await setDoc(doc(db, 'evaluations', docId), {{
                studentName: _currentUserName || _currentUserEmail.split('@')[0],
                studentId: _currentUserEmail,
                title: title,
                link: result.url,
                fileName: file.name,
                status: 'Pending',
                timestamp: new Date().toISOString()
              }});
              
              alert('✅ Answer successfully uploaded to Google Drive and submitted!');
              document.getElementById('ans-title').value = '';
              fileInput.value = '';
              progressContainer.style.display = 'none';
              window.loadMyAnswers();
            }} else {{
              throw new Error(result.message || 'Apps Script returned an error.');
            }}
          }} catch(e) {{
            console.error(e);
            alert('Upload failed: ' + e.message);
            progressContainer.style.display = 'none';
          }} finally {{
            btn.disabled = false;
            btn.textContent = 'Submit for Evaluation';
          }}
        }};
        
        reader.onerror = function(error) {{
          console.error(error);
          alert('Error reading file.');
          btn.disabled = false; 
          btn.textContent = 'Submit for Evaluation';
          progressContainer.style.display = 'none';
        }};

      }} catch (err) {{
        console.error(err);
        alert('Failed to initialize upload.');
        btn.disabled = false; 
        btn.textContent = 'Submit for Evaluation';
        progressContainer.style.display = 'none';
      }}
    }};
    
    '''
    
    html = re.sub(submit_old, submit_new, html, flags=re.DOTALL)

    with open('Aspirant/aspirant-dashboard.html', 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    main()
    print("Done")
