/* ═══════════════════════════════════════════════
   csv.js — RONE MentorOS
   CSV file parser & importer
═══════════════════════════════════════════════ */

const RoneCsv = (() => {

  // ── Parse raw CSV text ─────────────────────
  // Handles quoted fields with commas inside them
  function parseCSV(text) {
    const lines  = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    const result = [];

    lines.forEach(line => {
      if (!line.trim()) return;
      const fields = [];
      let current  = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
          fields.push(current.trim());
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());
      result.push(fields);
    });

    return result;
  }

  // ── CSV rows → array of objects ────────────
  function toObjects(rows) {
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.toLowerCase().trim().replace(/\s+/g, '_'));
    return rows.slice(1)
      .filter(row => row.some(cell => cell.trim()))
      .map(row => {
        const obj = {};
        headers.forEach((h, i) => { obj[h] = (row[i] || '').trim(); });
        return obj;
      });
  }

  // ── Import students from CSV text ──────────
  function importStudents(csvText) {
    const rows    = parseCSV(csvText);
    const objects = toObjects(rows);
    let imported  = 0;
    const errors  = [];

    objects.forEach((obj, i) => {
      if (!obj.name) { errors.push(`Row ${i + 2}: नाम खाली है`); return; }
      try {
        RoneData.addStudent(obj);
        imported++;
      } catch (e) {
        errors.push(`Row ${i + 2}: ${e.message}`);
      }
    });

    return { imported, errors, total: objects.length };
  }

  // ── Import mentors from CSV text ───────────
  function importMentors(csvText) {
    const rows    = parseCSV(csvText);
    const objects = toObjects(rows);
    let imported  = 0;
    const errors  = [];

    objects.forEach((obj, i) => {
      if (!obj.name) { errors.push(`Row ${i + 2}: नाम खाली है`); return; }
      try {
        RoneData.addMentor(obj);
        imported++;
      } catch (e) {
        errors.push(`Row ${i + 2}: ${e.message}`);
      }
    });

    return { imported, errors, total: objects.length };
  }

  // ── Read file & call importer ──────────────
  function readFile(file, type) {
    return new Promise((resolve, reject) => {
      if (!file) { reject(new Error('कोई फ़ाइल नहीं चुनी')); return; }
      if (!file.name.endsWith('.csv')) { reject(new Error('सिर्फ .csv फ़ाइल support है')); return; }

      const reader = new FileReader();
      reader.onload  = e => {
        const text   = e.target.result;
        const result = type === 'students'
          ? importStudents(text)
          : importMentors(text);
        resolve(result);
      };
      reader.onerror = () => reject(new Error('फ़ाइल पढ़ने में error'));
      reader.readAsText(file, 'UTF-8');
    });
  }

  // ── Sample CSV download ────────────────────
  function downloadSample(type) {
    let content;
    if (type === 'students') {
      content = [
        'name,target_year,medium,optional_subject,exam_goal,city,email,phone',
        'Aarav Sharma,2025,Hindi,History,UPSC CSE,Jaipur,aarav@email.com,9876543210',
        'Riya Patel,2026,English,Geography,RPSC RAS,Ahmedabad,riya@email.com,',
        'Karan Verma,2025,English,PSIR,UPSC CSE,Jodhpur,,',
      ].join('\n');
    } else {
      content = [
        'name,expertise,capacity,experience,rating,email',
        'Dr. Priya Menon,History Optional,8,Ex-IAS,4.9,priya@email.com',
        'Prof. Rakesh Joshi,GS Paper 2,10,Interview Appeared,4.7,rakesh@email.com',
        'Ms. Anjali Singh,Essay,6,,4.8,anjali@email.com',
      ].join('\n');
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `RONE_${type}_sample.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return { readFile, importStudents, importMentors, downloadSample };
})();
