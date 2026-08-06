import re

with open('Admin/admin-dashboard.html', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace any occurance of \'' with \'' (wait, I need to replace it with \')
# The literal text in the file is \\''
# I want to replace it with \''
c = c.replace(r"\\''", r"\''")

with open('Admin/admin-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(c)
print("Admin fixed!")
