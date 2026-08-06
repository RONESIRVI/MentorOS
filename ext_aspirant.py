with open('Aspirant/aspirant-dashboard.html', 'r', encoding='utf-8') as f:
    c = f.read()
s = c.find('<script type="module">')
e = c.rfind('</script>')
with open('temp_check.js', 'w', encoding='utf-8') as f:
    f.write(c[s+22:e])
