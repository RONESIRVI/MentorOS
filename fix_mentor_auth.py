with open('Mentor/mentor-dashboard.html', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace(
    "const docRef = doc(db, 'users', user.uid);",
    "const docRef = doc(db, 'userRoles', user.email.toLowerCase());"
)

with open('Mentor/mentor-dashboard.html', 'w', encoding='utf-8') as f:
    f.write(c)

print('Fixed Collection Reference!')
