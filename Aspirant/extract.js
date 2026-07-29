const fs = require('fs');
const c = fs.readFileSync('aspirant-dashboard.html', 'utf8');
const s = c.indexOf('<script type="module">');
const e = c.lastIndexOf('</script>');
fs.writeFileSync('temp_check.js', c.substring(s+22, e));
