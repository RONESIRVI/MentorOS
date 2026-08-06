import pandas as pd
import json
import os
import subprocess
import shutil
import sys

# Force UTF-8 for console output
sys.stdout.reconfigure(encoding='utf-8')

# Configuration
EXCEL_FILE = "resources.xlsx"
JSON_FILENAME = "quote_bank_files.json"
PORTAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def create_default_excel():
    data = [
        {"name": "Example PDF Document", "category": "ethics", "link": "https://drive.google.com/file/d/example_id/view"},
        {"name": "Thinkers Quotes Compilation", "category": "thinkers", "link": "https://drive.google.com/file/d/example_id/view"},
        {"name": "Governance Case Studies", "category": "governance", "link": "https://drive.google.com/file/d/example_id/view"}
    ]
    df = pd.DataFrame(data)
    df.to_excel(EXCEL_FILE, index=False)
    print(f"✅ Created default Excel file: {EXCEL_FILE}")
    print("👉 Please edit this Excel file with real PDF Links and run this script again.")

def main():
    print("====================================")
    print(" Quote Bank & Resources Updater")
    print("====================================")
    
    if not os.path.exists(EXCEL_FILE):
        print(f"⚠️ {EXCEL_FILE} not found!")
        create_default_excel()
        return

    print(f"📖 Reading {EXCEL_FILE}...")
    try:
        df = pd.read_excel(EXCEL_FILE)
        df = df.dropna(subset=['name', 'link']) # require name and link
        
        if 'category' not in df.columns:
            df['category'] = "ethics"
            
        df['category'] = df['category'].fillna("ethics")
        
        # Convert to list of dicts
        resources_data = df.to_dict(orient='records')
        
        print(f"✅ Found {len(resources_data)} resources.")
        
    except PermissionError:
        print("❌ Error: The Excel file is open! Please CLOSE the file in Excel and try again.")
        return
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return

    # Save JSON locally
    try:
        with open(JSON_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(resources_data, f, ensure_ascii=False, indent=2)
        print(f"✅ Saved local {JSON_FILENAME}")
    except Exception as e:
        print(f"❌ Error saving JSON file: {e}")
        return

    # Copy JSON to Portal Directory
    portal_json_path = os.path.join(PORTAL_DIR, JSON_FILENAME)
    try:
        shutil.copy2(JSON_FILENAME, portal_json_path)
        print(f"✅ Copied {JSON_FILENAME} to {PORTAL_DIR}")
    except Exception as e:
        print(f"❌ Error copying file to Portal folder: {e}")
        return

    # Push to GitHub
    print("🚀 Pushing resources to GitHub...")
    try:
        subprocess.run(["git", "add", JSON_FILENAME], cwd=PORTAL_DIR, check=True)
        status = subprocess.run(["git", "status", "--porcelain"], cwd=PORTAL_DIR, capture_output=True, text=True)
        if JSON_FILENAME in status.stdout:
            subprocess.run(["git", "commit", "-m", "Update quote_bank_files.json from Resources Manager"], cwd=PORTAL_DIR, check=True)
            subprocess.run(["git", "push", "origin", "main"], cwd=PORTAL_DIR, check=True)
            print("✅ Successfully pushed resources to GitHub!")
            print("🌐 Changes will be live on the portal in ~1 minute.")
        else:
            print("✅ No new changes to push (JSON is identical to the one on GitHub).")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git Command Error: {e}")

    print("====================================")
    print(" DONE UPDATING RESOURCES!")
    print("====================================")
    
if __name__ == "__main__":
    main()
