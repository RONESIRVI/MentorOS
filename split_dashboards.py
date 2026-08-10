import os
import re

def process_file(filepath, portal_name):
    print(f"Processing {filepath}...")
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the dashboard-canvas block
    canvas_match = re.search(r'<div class="dashboard-canvas">', content)
    if not canvas_match:
        print("Could not find dashboard-canvas in " + filepath)
        return
        
    start_idx = canvas_match.end()
    
    # We want to find where the canvas ends. We'll look for </main> or <!-- END SECTION --> or just the end of the last section.
    
    # Find all <div id="section-xxxx"
    pattern = r'<div\s+id="section-([a-zA-Z0-9_-]+)"'
    
    matches = list(re.finditer(pattern, content[start_idx:]))
    if not matches:
        print("No sections found in " + filepath)
        return
        
    components_dir = os.path.join(os.path.dirname(filepath), 'components')
    os.makedirs(components_dir, exist_ok=True)
    
    # Find the first </main> after start_idx
    main_end_idx = content.find('</main>', start_idx)
    if main_end_idx == -1:
        main_end_idx = len(content)
        
    new_content = content[:start_idx] + '\n        <div id="dynamic-content"></div>\n'
    
    end_of_last = start_idx
    
    # extract components
    for i in range(len(matches)):
        match = matches[i]
        section_id = match.group(1)
        
        start = start_idx + match.start()
        if i < len(matches) - 1:
            end = start_idx + matches[i+1].start()
            end_of_last = end
        else:
            # For the last section, we just find the last </div> before </main>
            end = content.rfind('</div>', start_idx, main_end_idx)
            # wait, the canvas has a closing </div>, so we need to go back one more </div> to get the section end
            end = content.rfind('</div>', start_idx, end-1)
            # actually let's just use the position right before </main>'s parent </div>
            # To be safe, we'll just capture up to a bit before the </main>
            # Often there's an <!-- END SECTION: ... --> let's try finding that
            end_comment = content.find('<!-- END SECTION:', start)
            if end_comment != -1 and end_comment < main_end_idx:
                end = content.find('-->', end_comment) + 3
            else:
                end = content.rfind('</div>', start_idx, content.rfind('</div>', start_idx, main_end_idx)-1) + 6
            end_of_last = end
            
        section_content = content[start:end].strip()
        
        comp_file = os.path.join(components_dir, f"{section_id}.html")
        with open(comp_file, 'w', encoding='utf-8') as cf:
            cf.write(section_content)
        print(f"Extracted component: {comp_file}")
        
    # append the rest of the file after the sections
    new_content += content[end_of_last:]
    
    # Write the new shell file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"Updated shell file: {filepath}")

base_dir = r"r:\RONE_Studio\RONE_MentorOS"
process_file(os.path.join(base_dir, 'Aspirant/aspirant-dashboard.html'), 'Aspirant')
process_file(os.path.join(base_dir, 'Mentor/mentor-dashboard.html'), 'Mentor')
process_file(os.path.join(base_dir, 'Admin/admin-dashboard.html'), 'Admin')

print("Extraction complete.")
