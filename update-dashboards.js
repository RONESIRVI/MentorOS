const fs = require('fs');

function updateDashboard(filePath, type) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Common replacements
  content = content.replace(/background:\s*#0f172a;/g, 'background: #0f070a;'); // Aspirant body
  content = content.replace(/background-color:\s*rgba\(30,\s*41,\s*59,\s*0\.6\)/g, 'background-color: rgba(15, 7, 10, 0.6)'); // Mentor body
  content = content.replace(/background-color:\s*#f1f5f9\s*!important;/g, 'background-color: #0f070a !important;'); // Admin body

  // Sidebar Gradient Replacements
  if (type === 'aspirant') {
    content = content.replace(/rgba\(139, 92, 246, 0\.15\)/g, 'rgba(99, 102, 241, 0.15)');
    content = content.replace(/rgba\(56, 189, 248, 0\.1\)/g, 'rgba(225, 29, 72, 0.1)');
    content = content.replace(/#0b1120 0%, #171033 50%, #200d46 100%/g, '#0f070a 0%, #1a0b12 50%, #2d101a 100%');
    
    // Highlight colors
    content = content.replace(/#38bdf8/g, '#e11d48');
    content = content.replace(/rgba\(56, 189, 248/g, 'rgba(225, 29, 72');
    
    // Lock overlay buttons
    content = content.replace(/#0284c7/g, '#be123c');
    content = content.replace(/#0369a1/g, '#9f1239');
    content = content.replace(/rgba\(2, 132, 199/g, 'rgba(190, 18, 60');
  } 
  else if (type === 'mentor') {
    content = content.replace(/rgba\(16, 185, 129, 0\.15\)/g, 'rgba(99, 102, 241, 0.15)');
    content = content.replace(/rgba\(5, 150, 105, 0\.1\)/g, 'rgba(225, 29, 72, 0.1)');
    content = content.replace(/#0b1120 0%, #064e3b 50%, #022c22 100%/g, '#0f070a 0%, #1a0b12 50%, #2d101a 100%');
    
    // Highlight colors
    content = content.replace(/#10b981/g, '#e11d48');
    content = content.replace(/rgba\(16, 185, 129/g, 'rgba(225, 29, 72');
    
    // Lock overlay buttons
    content = content.replace(/#059669/g, '#be123c');
    content = content.replace(/#047857/g, '#9f1239');
    content = content.replace(/rgba\(5, 150, 105/g, 'rgba(190, 18, 60');
  }
  else if (type === 'admin') {
    content = content.replace(/rgba\(139, 92, 246, 0\.15\)/g, 'rgba(99, 102, 241, 0.15)');
    content = content.replace(/rgba\(99, 102, 241, 0\.1\)/g, 'rgba(225, 29, 72, 0.1)');
    content = content.replace(/#0b1120 0%, #171033 50%, #200d46 100%/g, '#0f070a 0%, #1a0b12 50%, #2d101a 100%');
    
    // Highlight colors
    content = content.replace(/#8b5cf6/g, '#e11d48');
    content = content.replace(/rgba\(139, 92, 246/g, 'rgba(225, 29, 72');
    
    // Lock overlay buttons
    content = content.replace(/#6d28d9/g, '#be123c');
    content = content.replace(/#5b21b6/g, '#9f1239');
    content = content.replace(/rgba\(109, 40, 217/g, 'rgba(190, 18, 60');
  }

  // Update card Ripple Glow
  content = content.replace(/rgba\(59, 130, 246, 0\.6\)/g, 'rgba(225, 29, 72, 0.6)');
  content = content.replace(/rgba\(59, 130, 246, 0\)/g, 'rgba(225, 29, 72, 0)');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated: ' + filePath);
}

updateDashboard('Aspirant/aspirant-dashboard.html', 'aspirant');
updateDashboard('Mentor/mentor-dashboard.html', 'mentor');
updateDashboard('Admin/admin-dashboard.html', 'admin');
