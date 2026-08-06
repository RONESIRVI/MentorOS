import re

with open('Admin/admin-dashboard.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(r"\\')", r"\')")

with open('Admin/admin-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("Admin fixed again!")
