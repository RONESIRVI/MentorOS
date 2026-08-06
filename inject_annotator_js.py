import re

def main():
    with open('build_mentor.py', 'r', encoding='utf-8') as f:
        content = f.read()

    js_logic = '''
    // Annotator Logic
    window.currentPdfUrl = null;
    window.pdfDoc = null;
    window.pdfPages = [];
    window.drawColor = '#ef4444';
    window.isDrawing = false;
    
    window.setDrawColor = (c) => { window.drawColor = c; };
    window.clearCurrentPage = () => {
      window.pdfPages.forEach(p => {
        const ctx = p.drawCanvas.getContext('2d');
        ctx.clearRect(0,0,p.drawCanvas.width,p.drawCanvas.height);
      });
    };

    window.initPdfViewer = async function(url) {
      const container = document.getElementById('pdf-pages-container');
      const loader = document.getElementById('pdf-loading-text');
      container.innerHTML = '';
      window.pdfPages = [];
      window.pdfDoc = null;
      window.currentPdfUrl = url;
      
      if(!url) {
         loader.textContent = 'No PDF attached.';
         return;
      }
      
      loader.textContent = 'Loading PDF...';
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        window.pdfDoc = await loadingTask.promise;
        loader.textContent = `PDF Loaded (${window.pdfDoc.numPages} pages)`;
        
        for(let i=1; i<=window.pdfDoc.numPages; i++) {
          const page = await window.pdfDoc.getPage(i);
          const viewport = page.getViewport({scale: 1.5});
          
          const pageWrapper = document.createElement('div');
          pageWrapper.style.position = 'relative';
          pageWrapper.style.marginBottom = '20px';
          pageWrapper.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          
          const renderCanvas = document.createElement('canvas');
          renderCanvas.width = viewport.width;
          renderCanvas.height = viewport.height;
          renderCanvas.style.display = 'block';
          
          const drawCanvas = document.createElement('canvas');
          drawCanvas.width = viewport.width;
          drawCanvas.height = viewport.height;
          drawCanvas.style.position = 'absolute';
          drawCanvas.style.top = '0';
          drawCanvas.style.left = '0';
          drawCanvas.style.cursor = 'crosshair';
          
          pageWrapper.appendChild(renderCanvas);
          pageWrapper.appendChild(drawCanvas);
          container.appendChild(pageWrapper);
          
          const renderContext = renderCanvas.getContext('2d');
          await page.render({canvasContext: renderContext, viewport: viewport}).promise;
          
          // Setup Drawing
          const ctx = drawCanvas.getContext('2d');
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          let drawing = false;
          
          const startDraw = (e) => {
            drawing = true;
            const rect = drawCanvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            ctx.beginPath();
            ctx.moveTo(x, y);
          };
          
          const draw = (e) => {
            if(!drawing) return;
            e.preventDefault();
            const rect = drawCanvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            ctx.strokeStyle = window.drawColor;
            ctx.lineTo(x, y);
            ctx.stroke();
          };
          
          const endDraw = () => { drawing = false; ctx.closePath(); };
          
          drawCanvas.addEventListener('mousedown', startDraw);
          drawCanvas.addEventListener('mousemove', draw);
          drawCanvas.addEventListener('mouseup', endDraw);
          drawCanvas.addEventListener('mouseout', endDraw);
          
          drawCanvas.addEventListener('touchstart', startDraw, {passive:false});
          drawCanvas.addEventListener('touchmove', draw, {passive:false});
          drawCanvas.addEventListener('touchend', endDraw);
          
          window.pdfPages.push({ pageNum: i, drawCanvas: drawCanvas });
        }
      } catch (err) {
        console.error('PDF load error:', err);
        loader.textContent = 'Error loading PDF. (Check CORS settings)';
      }
    };
    '''
    
    # Modify openEvalModal to call initPdfViewer instead of setting iframe src
    old_modal = r'''      let previewLink = pdfLink;
      if \(pdfLink && pdfLink\.includes\('drive\.google\.com'\) && pdfLink\.includes\('/view'\)\) \{
        previewLink = pdfLink\.replace\('/view', '/preview'\);
      \} else if \(pdfLink && pdfLink\.includes\('drive\.google\.com'\) && !pdfLink\.includes\('/preview'\)\) \{
        previewLink = pdfLink \+ '/preview';
      \}
      const frame = document\.getElementById\('eval-pdf-frame'\);
      if\(frame\) frame\.src = previewLink;
      
      const btnAnn = document\.getElementById\('btn-annotate-pdf'\);
      if\(btnAnn\) btnAnn\.href = pdfLink;'''

    new_modal = r'''      window.initPdfViewer(pdfLink);'''
    
    content = re.sub(old_modal, new_modal, content)
    
    # Prepend js_logic to the script block
    content = content.replace('// Eval Modal logic', js_logic + '\n    // Eval Modal logic')
    
    # Modify saveEval to merge PDF and upload it
    save_regex = r'''    window\.saveEval = async function\(\) \{\s*const id = document\.getElementById\('eval-id'\)\.value;\s*const marks = document\.getElementById\('eval-marks'\)\.value;\s*const feedback = document\.getElementById\('eval-feedback'\)\.value;\s*try \{\s*await updateDoc\(doc\(db, 'evaluations', id\), \{\s*marks: marks,\s*feedback: feedback,\s*status: 'Evaluated',\s*evaluatedAt: new Date\(\)\.toISOString\(\)\s*\}\);\s*alert\('Evaluation saved!'\);\s*closeEvalModal\(\);\s*loadEvaluations\(\);\s*\} catch\(e\) \{\s*console\.error\(e\);\s*alert\('Error saving evaluation: ' \+ e\.message\);\s*\}\s*\};'''
    
    new_save = r'''    window.saveEval = async function() {
      const id = document.getElementById('eval-id').value;
      const marks = document.getElementById('eval-marks').value;
      const feedback = document.getElementById('eval-feedback').value;
      
      const btn = document.querySelector('#eval-modal button[onclick="saveEval()"]');
      btn.disabled = true; btn.textContent = 'Saving...';
      
      try {
        let finalPdfUrl = window.currentPdfUrl;
        
        // If we have a PDF loaded, merge annotations
        if(window.pdfDoc && window.pdfPages.length > 0) {
           const existingPdfBytes = await fetch(window.currentPdfUrl).then(res => res.arrayBuffer());
           const pdfDocLib = await PDFLib.PDFDocument.load(existingPdfBytes);
           const pages = pdfDocLib.getPages();
           
           for(let i=0; i<window.pdfPages.length; i++) {
             const pageData = window.pdfPages[i];
             const canvas = pageData.drawCanvas;
             // Check if canvas has strokes (we can skip empty ones, but let's just burn all for simplicity)
             const pngImageBytes = await new Promise(resolve => canvas.toBlob(blob => blob.arrayBuffer().then(resolve), 'image/png'));
             const pngImage = await pdfDocLib.embedPng(pngImageBytes);
             const page = pages[i];
             page.drawImage(pngImage, {
               x: 0, y: 0, 
               width: page.getWidth(), 
               height: page.getHeight()
             });
           }
           
           const pdfBytes = await pdfDocLib.save();
           // Upload back to Firebase Storage
           const storageRef = ref(storage, `evaluations/annotated_${id}.pdf`);
           await uploadBytesResumable(storageRef, pdfBytes, {contentType: 'application/pdf'});
           finalPdfUrl = await getDownloadURL(storageRef);
        }

        await updateDoc(doc(db, 'evaluations', id), {
          marks: marks,
          feedback: feedback,
          annotatedPdfUrl: finalPdfUrl,
          status: 'Evaluated',
          evaluatedAt: new Date().toISOString()
        });
        alert('Evaluation saved successfully!');
        closeEvalModal();
        loadEvaluations();
      } catch(e) {
        console.error(e);
        alert('Error saving evaluation: ' + e.message);
      } finally {
        btn.disabled = false; btn.textContent = 'Submit Evaluation';
      }
    };'''
    
    content = re.sub(save_regex, new_save, content)
    
    # Add Storage import to Mentor JS
    content = content.replace(
        'import { getFirestore, doc, getDoc, collection, getDocs, setDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";',
        'import { getFirestore, doc, getDoc, collection, getDocs, setDoc, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";\nimport { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";'
    )
    content = content.replace('const db = getFirestore(app);', 'const db = getFirestore(app);\nconst storage = getStorage(app);')
    
    with open('build_mentor.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
