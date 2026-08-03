# RONE MentorOS — Allocation Portal

## 📁 File Structure

```
rone-mentoros/
├── index.html              ← Main portal page
├── css/
│   └── style.css           ← सभी styles
├── js/
│   ├── data.js             ← Data store & business logic
│   ├── render.js           ← ID card & UI rendering
│   ├── csv.js              ← CSV import/export
│   └── app.js              ← Main controller (events, tabs)
├── assets/
│   ├── sample_students.csv ← Student CSV example
│   └── sample_mentors.csv  ← Mentor CSV example
└── README.md
```

---

## 🚀 अपने पोर्टल में कैसे जोड़ें

### Option 1 — अलग Page के रूप में (Recommended)
अपने existing portal में एक नया route/page add करें:

```
yourwebsite.com/mentoros   →   index.html
```

**Steps:**
1. पूरा `rone-mentoros/` folder अपने server पर upload करें
2. अपने portal के navigation में link add करें:
   ```html
   <a href="/mentoros/index.html">MentorOS Portal</a>
   ```

---

### Option 2 — iframe Embed
अगर आप अपने existing portal में embed करना चाहते हैं:

```html
<iframe
  src="/rone-mentoros/index.html"
  width="100%"
  height="800px"
  style="border: none; border-radius: 12px;"
  title="RONE MentorOS"
></iframe>
```

---

### Option 3 — React/Next.js में Integrate
अगर आपका portal React में है, तो JS files को components में convert करें।
`data.js` का logic → React Context/Zustand में  
`render.js` का HTML → JSX components में

---

## ⚙️ Customization

### Brand color बदलें (`css/style.css` में):
```css
:root {
  --navy: #1a3a5c;   /* ← अपना primary color यहाँ */
}
```

### Logo बदलें (`index.html` में):
```html
<div class="logo-mark"><span>RO</span></div>  <!-- ← initials बदलें -->
<span class="logo-title">RONE MentorOS</span>  <!-- ← नाम बदलें -->
```

### Backend API से connect करें (`js/data.js` में):
`saveLocal()` function को API call से replace करें:
```js
async function saveLocal() {
  await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
}
```

---

## 📋 CSV Format

### Student CSV
| Column | Required | Example |
|--------|----------|---------|
| name | ✅ | Aarav Sharma |
| class | ✅ | XI |
| stream | ✅ | Science |
| subject | ✅ | Physics, Maths |
| goal | ✅ | JEE Advanced |
| city | ✅ | Jaipur |
| email | Optional | student@email.com |
| phone | Optional | 9876543210 |
| mentor_id | Optional | RONE-MNT-2025-0001 |

### Mentor CSV
| Column | Required | Example |
|--------|----------|---------|
| name | ✅ | Dr. Priya Menon |
| specialisation | ✅ | JEE / Maths |
| capacity | ✅ | 8 |
| institution | Optional | IIT Bombay Alumni |
| rating | Optional | 4.9 |
| email | Optional | mentor@email.com |

---

## 🛠 Features
- ✅ Student & Mentor ID card generation
- ✅ CSV import (drag & drop)
- ✅ Auto-allocation (goal/subject matching)
- ✅ Manual allocation
- ✅ Search & filter
- ✅ LocalStorage persistence
- ✅ Mobile responsive
- ✅ Dark mode support
