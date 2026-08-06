import pandas as pd
import json
import os
import subprocess
import shutil
import sys

# Force UTF-8 for console output
sys.stdout.reconfigure(encoding='utf-8')

# Configuration
EXCEL_FILE = "categories.xlsx"
JSON_FILENAME = "snippet_categories.json"
PORTAL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

def create_default_excel():
    with pd.ExcelWriter(EXCEL_FILE, engine='openpyxl') as writer:
        # Sheet 1: Categories
        data_sheet1 = [
            {"Category": "Good Introduction"},
            {"Category": "Good Body / Arguments"},
            {"Category": "Good Conclusion"},
            {"Category": "Data & Facts Usage"},
            {"Category": "Diagrams & Maps"},
            {"Category": "Presentation / Handwriting"},
            {"Category": "Areas of Improvement"}
        ]
        df1 = pd.DataFrame(data_sheet1)
        df1.to_excel(writer, sheet_name='Categories', index=False)
        
        # Sheet 2: Metadata (Rank, Year, Paper)
        data_sheet2 = [
            {"Rank / Name": "Rank 1 - Shruti Sharma", "Year": 2023, "Paper": "GS Paper 1"},
            {"Rank / Name": "Rank 2 - Ankita Agarwal", "Year": 2024, "Paper": "GS Paper 2"},
            {"Rank / Name": "Rank 3 - Gamini Singla", "Year": 2025, "Paper": "GS Paper 3"},
            {"Rank / Name": "", "Year": "", "Paper": "GS Paper 4"},
            {"Rank / Name": "", "Year": "", "Paper": "Essay"},
            {"Rank / Name": "", "Year": "", "Paper": "Optional"}
        ]
        df2 = pd.DataFrame(data_sheet2)
        df2.to_excel(writer, sheet_name='Metadata', index=False)
        
    print(f"✅ Created default Excel file: {EXCEL_FILE} with 2 Sheets.")
    print("👉 Please edit this Excel file and run this script again.")

def main():
    print("====================================")
    print(" Quote Bank & Resources Manager")
    print("====================================")
    
    if not os.path.exists(EXCEL_FILE):
        print(f"⚠️ {EXCEL_FILE} not found!")
        create_default_excel()
        return

    print(f"📖 Reading {EXCEL_FILE}...")
    try:
        # Read Sheet 1 (Categories)
        try:
            df1 = pd.read_excel(EXCEL_FILE, sheet_name=0)
            df1 = df1.dropna(subset=['Category'])
            categories_list = df1['Category'].astype(str).tolist()
        except Exception:
            categories_list = []
            
        # Read Sheet 2 (Metadata)
        try:
            df2 = pd.read_excel(EXCEL_FILE, sheet_name=1)
            # We want unique, non-null values for each column
            ranks_list = df2['Rank / Name'].dropna().astype(str).unique().tolist() if 'Rank / Name' in df2.columns else []
            years_list = df2['Year'].dropna().astype(str).str.replace(r'\.0$', '', regex=True).unique().tolist() if 'Year' in df2.columns else []
            papers_list = df2['Paper'].dropna().astype(str).unique().tolist() if 'Paper' in df2.columns else []
        except Exception:
            ranks_list = []
            years_list = []
            papers_list = []
            
        # Deduplicate categories exactly
        seen = set()
        deduped_cats = []
        for cat in categories_list:
            c = cat.strip()
            if c and c not in seen:
                seen.add(c)
                deduped_cats.append(c)
        categories_list = deduped_cats

        output_data = {
            "categories": categories_list,
            "ranks": [r for r in ranks_list if r.strip()],
            "years": [y for y in years_list if y.strip()],
            "papers": [p for p in papers_list if p.strip()]
        }
        
        print(f"✅ Found {len(output_data['categories'])} categories, {len(output_data['ranks'])} ranks, {len(output_data['years'])} years, {len(output_data['papers'])} papers.")
        
    except PermissionError:
        print("❌ Error: The Excel file is open! Please CLOSE the file in Excel and try again.")
        return
    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")
        return

    # Save JSON and JS locally
    try:
        with open(JSON_FILENAME, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        print(f"✅ Saved local {JSON_FILENAME}")
        
        js_filename = JSON_FILENAME.replace('.json', '.js')
        js_content = f"window.SNIPPET_CATEGORIES = {json.dumps(output_data, ensure_ascii=False, indent=2)};"
        with open(js_filename, 'w', encoding='utf-8') as f:
            f.write(js_content)
        print(f"✅ Saved local {js_filename}")
        
    except Exception as e:
        print(f"❌ Error saving JSON/JS files: {e}")
        return

    # Copy files to Portal Directory
    portal_json_path = os.path.join(PORTAL_DIR, JSON_FILENAME)
    portal_js_path = os.path.join(PORTAL_DIR, js_filename)
    try:
        shutil.copy2(JSON_FILENAME, portal_json_path)
        shutil.copy2(js_filename, portal_js_path)
        print(f"✅ Copied {JSON_FILENAME} and {js_filename} to {PORTAL_DIR}")
    except Exception as e:
        print(f"❌ Error copying files to Portal folder: {e}")
        return

    # Push to GitHub
    print("🚀 Pushing changes to GitHub...")
    try:
        # Stage all updated files
        subprocess.run(["git", "add", "Quote_Bank_Resources_Manager/" + JSON_FILENAME], cwd=PORTAL_DIR, check=True)
        subprocess.run(["git", "add", JSON_FILENAME], cwd=PORTAL_DIR, check=True)
        subprocess.run(["git", "add", "Quote_Bank_Resources_Manager/" + js_filename], cwd=PORTAL_DIR, check=True)
        subprocess.run(["git", "add", js_filename], cwd=PORTAL_DIR, check=True)
        
        # Check if anything is staged for commit
        status = subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=PORTAL_DIR, capture_output=True, text=True)
        if status.stdout.strip():
            subprocess.run(["git", "commit", "-m", "Update snippet_categories.json via bat file"], cwd=PORTAL_DIR, check=True)
            
            # 🔄 Sync with remote before pushing to prevent conflict errors!
            print("🔄 Syncing with GitHub (Fetching new updates)...")
            try:
                subprocess.run(["git", "pull", "--rebase", "origin", "main"], cwd=PORTAL_DIR, check=True)
            except subprocess.CalledProcessError:
                print("⚠️ Warning: Auto-merge during pull failed, attempting to push anyway...")
                
            subprocess.run(["git", "push", "origin", "main"], cwd=PORTAL_DIR, check=True)
            print("✅ Successfully pushed to GitHub!")
            print("🌐 Changes will be live on the portal in ~1 minute.")
        else:
            print("✅ No new changes to push (JSON is identical to the one on GitHub).")
    except subprocess.CalledProcessError as e:
        print(f"❌ Git Command Error: {e}")
        print("Please check if there are any git conflicts in the MentorOS repository.")

    print("====================================")
    print(" DONE!")
    print("====================================")
    
if __name__ == "__main__":
    main()
