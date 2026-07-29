import { getFirestore, doc, getDoc, collection, getDocs, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { app } from "../../script.js"; // Wait, we can just initialize db here or pass it.

// Let's just use the global db from admin-dashboard.html for simplicity in this raw JS setup, 
// OR we initialize db here.
const db = getFirestore(); // if already initialized in app

export async function loadUsersList() {
  const tbody = document.getElementById('admin-users-table-body');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: var(--mute);">Fetching latest users...</td></tr>';
  
  try {
    const querySnapshot = await getDocs(collection(db, "userRoles"));
    let html = '';
    let totalUsers = 0;

    querySnapshot.forEach((docSnap) => {
      totalUsers++;
      const email = docSnap.id;
      const data = docSnap.data();
      const role = data.role || 'Aspirant';
      
      let roleBadgeClass = 'status-pending';
      if (role.toLowerCase() === 'admin') roleBadgeClass = 'status-active';
      if (role.toLowerCase() === 'mentor') roleBadgeClass = 'status-active'; // Or another style

      // Avatar initial
      const initial = email.charAt(0).toUpperCase();

      html += `
        <tr style="border-bottom: 1px solid var(--border);">
          <td style="padding: 12px;">
            <div class="user-cell" style="display:flex; align-items:center; gap:12px;">
              <div class="user-avatar" style="width:36px; height:36px; background:#e2e8f0; color:#475569; display:flex; align-items:center; justify-content:center; border-radius:50%; font-weight:bold;">${initial}</div>
              <div>
                <div style="font-weight:600; color:#0f172a;">${email}</div>
              </div>
            </div>
          </td>
          <td style="padding: 12px;">
            <span class="status-badge ${roleBadgeClass}">${role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </td>
          <td style="padding: 12px; text-align:right;">
            <select onchange="window.changeUserRole('${email}', this.value)" style="padding:6px; border:1px solid var(--border); border-radius:6px; background:white; color:var(--text); cursor:pointer;">
              <option value="" disabled selected>Change Role...</option>
              <option value="Aspirant">Aspirant</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
            </select>
          </td>
        </tr>
      `;
    });

    if (html === '') {
      html = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: var(--mute);">No registered users found.</td></tr>';
    }

    tbody.innerHTML = html;
    const totalUsersEl = document.getElementById('stat-total-users');
    if (totalUsersEl) totalUsersEl.textContent = totalUsers;

  } catch (error) {
    console.error("Error fetching users:", error);
    tbody.innerHTML = '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #ef4444;">Failed to load users. See console.</td></tr>';
  }
}

export async function changeUserRole(email, newRole) {
  if (!confirm(`Are you sure you want to make ${email} a ${newRole}?`)) return;
  
  try {
    await setDoc(doc(db, "userRoles", email), { role: newRole }, { merge: true });
    alert(`Successfully updated ${email} to ${newRole}!`);
    loadUsersList(); // Refresh
  } catch (error) {
    console.error("Error updating role:", error);
    alert("Failed to update role. Check console.");
  }
}
