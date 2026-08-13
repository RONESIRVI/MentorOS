import os
import re

for root, _, files in os.walk('R:/RONE_Studio/RONE_MentorOS'):
    for file in files:
        if file.endswith('.html'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                # Fix stat-card background
                content = re.sub(
                    r'background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*1\),\s*rgba\(\d+,\s*\d+,\s*\d+,\s*[\d\.]+\)\);',
                    r'background: rgba(15, 23, 42, 0.6);',
                    content
                )
                content = re.sub(
                    r'background:\s*linear-gradient\(135deg,\s*rgba\(255,\s*255,\s*255,\s*0\.9\),\s*rgba\(\d+,\s*\d+,\s*\d+,\s*[\d\.]+\)\);',
                    r'background: rgba(15, 23, 42, 0.6);',
                    content
                )
                # Fix any other white-ish backgrounds
                content = re.sub(
                    r'background(-color)?:\s*(#ffffff|#fff|rgba\(255,\s*255,\s*255,\s*1\)|white)\b',
                    r'background\1: rgba(15, 23, 42, 0.6)',
                    content,
                    flags=re.IGNORECASE
                )
                # Fix border
                content = re.sub(
                    r'border:\s*1px\s*solid\s*rgba\(255,\s*255,\s*255,\s*0\.8\);',
                    r'border: 1px solid rgba(255, 255, 255, 0.08);',
                    content
                )
                # Fix color in stat-card
                content = re.sub(
                    r'color:\s*(#334155|#1e293b|#0f172a)\b',
                    r'color: #f8fafc',
                    content,
                    flags=re.IGNORECASE
                )
                content = re.sub(
                    r'color:\s*(#475569|#64748b)\b',
                    r'color: #94a3b8',
                    content,
                    flags=re.IGNORECASE
                )

                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
            except Exception as e:
                print(f"Skipping {filepath}: {e}")

print('Fixed stat cards in HTML files')
