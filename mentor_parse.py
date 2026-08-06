import re
with open('Mentor/mentor-dashboard.html', 'r', encoding='utf-8') as f:
    c = f.read()
print('Sections:')
for sec in re.findall(r'<div id=\"(section-[^\"]+)\"', c):
    print('  -', sec)
print('Links:')
for link in re.findall(r'class=\"sidebar-nav-item[^>]*>(?:<[^>]+>)*\s*([^<]+?)\s*</a>', c):
    print('  -', link)
