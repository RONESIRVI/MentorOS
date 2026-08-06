import codecs

with codecs.open('Aspirant/aspirant-dashboard.html', 'r', 'utf-8') as f:
    content = f.read()

content = content.replace('prompt("Please enter your GitHub', 'prompt(`Please enter your GitHub')
content = content.replace('https://github.com/settings/tokens")', 'https://github.com/settings/tokens`)')
content = content.replace('alert("✅ Sync started successfully!', 'alert(`✅ Sync started successfully!')
content = content.replace('Progress.")', 'Progress.`)')

with codecs.open('Aspirant/aspirant-dashboard.html', 'w', 'utf-8') as f:
    f.write(content)

print('Fixed!')
