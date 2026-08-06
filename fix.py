import re

with open('Admin/admin-dashboard.html', 'r', encoding='utf-8') as f:
    content = f.read()

# I want the exact output in HTML to be:
# <button onclick="window.openEditTxnModal(\''+t.id+'\')" ...
# This translates to literal backslash, single quote, quote, +, t, ., i, d, +, quote, backslash, single quote, quote.

def repl_1(m):
    return r'onclick="window.openEditTxnModal(\'' + m.group(1) + r'\')"'
def repl_2(m):
    return r'onclick="window.deleteTxn(\'' + m.group(1) + r'\')"'
def repl_3(m):
    return r'onclick="window.openEditCourseModal(\'' + m.group(1) + r'\')"'
def repl_4(m):
    # m.group(1) is id, m.group(2) is safeName
    return r'onclick="window.deleteCourse(\'' + m.group(1) + r'\',\'' + m.group(2) + r'\')"'

# Strip everything inside the parens and put the correct one
content = re.sub(r'onclick="window\.openEditTxnModal\([^)]+\)"', lambda m: r'onclick="window.openEditTxnModal(\'' + "'+t.id+'" + r'\')"', content)
content = re.sub(r'onclick="window\.deleteTxn\([^)]+\)"', lambda m: r'onclick="window.deleteTxn(\'' + "'+t.id+'" + r'\')"', content)
content = re.sub(r'onclick="window\.openEditCourseModal\([^)]+\)"', lambda m: r'onclick="window.openEditCourseModal(\'' + "'+id+'" + r'\')"', content)
content = re.sub(r'onclick="window\.deleteCourse\([^)]+\)"', lambda m: r'onclick="window.deleteCourse(\'' + "'+id+'" + r'\',\'' + "'+safeName+'" + r'\')"', content)

with open('Admin/admin-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Replaced!")
