import re

def main():
    with open('build_mentor.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add pdf.js and pdf-lib to the head
    head_injection = '''  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
  <script>pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';</script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>'''
    content = content.replace('<link rel="stylesheet" href="../style.css">',
                              '<link rel="stylesheet" href="../style.css">\n' + head_injection)

    # 2. Replace the iframe with the annotator UI
    iframe_regex = r'<div style="flex:1;position:relative;">\s*<iframe id="eval-pdf-frame" src="" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none;"></iframe>\s*</div>'
    annotator_ui = '''<div style="flex:1;position:relative;background:#e2e8f0;overflow:auto;display:flex;flex-direction:column;align-items:center;" id="pdf-scroll-container">
          <div id="pdf-toolbar" style="position:sticky;top:0;background:white;width:100%;padding:10px;display:flex;gap:10px;justify-content:center;box-shadow:0 2px 4px rgba(0,0,0,0.1);z-index:10;">
            <button onclick="window.setDrawColor('#ef4444')" style="background:#ef4444;width:30px;height:30px;border-radius:15px;border:none;cursor:pointer;"></button>
            <button onclick="window.setDrawColor('#3b82f6')" style="background:#3b82f6;width:30px;height:30px;border-radius:15px;border:none;cursor:pointer;"></button>
            <button onclick="window.setDrawColor('#10b981')" style="background:#10b981;width:30px;height:30px;border-radius:15px;border:none;cursor:pointer;"></button>
            <div style="width:1px;background:#cbd5e1;margin:0 5px;"></div>
            <button onclick="window.clearCurrentPage()" style="padding:5px 15px;border:1px solid #cbd5e1;background:white;border-radius:5px;cursor:pointer;font-weight:600;">Clear Page</button>
          </div>
          <div id="pdf-pages-container" style="display:flex;flex-direction:column;gap:20px;padding:20px;">
            <!-- Pages will be rendered here -->
          </div>
        </div>'''
    content = re.sub(iframe_regex, annotator_ui, content)

    # 3. Replace the 'Open to Draw' button with a loading text
    button_regex = r'<a id="btn-annotate-pdf"[\s\S]*?</a>'
    new_button = '<span id="pdf-loading-text" style="font-size:0.9rem;color:#64748b;font-weight:600;"></span>'
    content = re.sub(button_regex, new_button, content)

    with open('build_mentor.py', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    main()
