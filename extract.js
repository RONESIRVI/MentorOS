const fs = require('fs');
const content = fs.readFileSync('Admin/admin-dashboard.html', 'utf-8');
const start = content.indexOf('<script type="module">');
const end = content.lastIndexOf('</script>');
const scriptText = content.substring(start + 22, end);
fs.writeFileSync('temp_check.js', scriptText);
console.log('Done');
