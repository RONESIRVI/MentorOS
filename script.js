/* ============================================
   RONE MentorOS — Firebase Auth + UI Script
   ============================================ */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB0T0bh7b7WpaGYyBk81MrqfRn2AUkXjfg",
  authDomain: "mains-rone-cse-e5268.firebaseapp.com",
  projectId: "mains-rone-cse-e5268",
  storageBucket: "mains-rone-cse-e5268.firebasestorage.app",
  messagingSenderId: "275537569597",
  appId: "1:275537569597:web:e8e4ad1dc25e7b9744c754"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ROLE_REDIRECTS = {
  admin:    'admin-dashboard.html',
  mentor:   'mentor-dashboard.html',
  Aspirant: 'aspirant-dashboard.html'
};

const SUPER_ADMIN_EMAIL = 'figuring.cse@gmail.com';

let expectedRoleLogin = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const role = await getUserRole(user.email);
    
    // Strict Tab Checking during login
    if (expectedRoleLogin && expectedRoleLogin.toLowerCase() !== role.toLowerCase()) {
       await signOut(auth);
       showError(`❌ Access Denied! You are registered as '${role}', not '${expectedRoleLogin}'. Please use the correct tab.`);
       expectedRoleLogin = null;
       return;
    }
    
    // Clear it so auto-login on refresh doesn't fail
    expectedRoleLogin = null;
    await redirectByRole(user, role);
  }
});

async function getUserRole(email) {
  const emailLower = email.toLowerCase();
  if (emailLower === SUPER_ADMIN_EMAIL) return 'admin';
  try {
    const roleDocRef = doc(db, 'userRoles', emailLower);
    const roleDoc = await getDoc(roleDocRef);
    if (roleDoc.exists()) {
      return roleDoc.data().role || 'Aspirant';
    }
  } catch (err) {
    console.error('Role fetch error:', err);
  }
  return 'Aspirant';
}

async function redirectByRole(user, role) {
  if (!role) {
    role = await getUserRole(user.email);
  }
  const redirectUrl = ROLE_REDIRECTS[role] || ROLE_REDIRECTS.Aspirant;
  
  // Prevent infinite redirect loops if already on the dashboard
  if (!window.location.pathname.includes(redirectUrl)) {
    window.location.href = redirectUrl;
  }
}

function showError(msg) {
  const errEl = document.getElementById('login-error-msg');
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.style.display = 'block';
  setTimeout(() => { errEl.style.display = 'none'; }, 4000);
}

function showSuccess(msg) {
  const errEl = document.getElementById('login-error-msg');
  if (!errEl) return;
  errEl.textContent = msg;
  errEl.style.color = '#10b981';
  errEl.style.background = 'rgba(16,185,129,0.1)';
  errEl.style.display = 'block';
}

function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = '<span>Signing in...</span>';
    btn.style.opacity = '0.8';
  } else {
    btn.disabled = false;
    btn.innerHTML = '<span>Login to Dashboard</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
    btn.style.opacity = '1';
  }
}

function getErrorMessage(code) {
  const messages = {
    'auth/user-not-found':      '❌ यह Email registered नहीं है।',
    'auth/wrong-password':      '❌ Password गलत है। फिर से try करें।',
    'auth/invalid-email':       '❌ Valid Email address डालें।',
    'auth/too-many-requests':   '⚠️ बहुत ज्यादा attempts। कुछ देर बाद try करें।',
    'auth/user-disabled':       '❌ यह account disable कर दिया गया है।',
    'auth/invalid-credential':  '❌ Email या Password गलत है।',
  };
  return messages[code] || '❌ Login failed। Admin से contact करें।';
}

// ----------------------------------------------------
// UI EVENT LISTENERS
// Modules run after DOM parsing, so DOM is ready here
// ----------------------------------------------------

// 1. LOGIN TABS
const loginTabs = document.querySelectorAll('.login-tab');
const tabContents = document.querySelectorAll('.tab-content');
loginTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    loginTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    const target = document.getElementById(`tab-${tab.dataset.tab}-content`);
    if (target) target.classList.add('active');
  });
});

// 2. FIREBASE LOGIN FORMS
const studentForm = document.getElementById('studentLoginForm');
const studentBtn  = document.getElementById('studentLoginBtn');

studentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  expectedRoleLogin = 'Aspirant';
  const email    = document.getElementById('student-email').value.trim();
  const password = document.getElementById('student-password').value;

  if (!email || !password) {
    showError('Email और Password दोनों डालें।');
    studentForm.style.animation = 'shake 0.4s ease';
    setTimeout(() => studentForm.style.animation = '', 400);
    return;
  }
  setLoading(studentBtn, true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    setLoading(studentBtn, false);
    showError(getErrorMessage(err.code));
  }
});

const mentorForm = document.querySelector('#tab-mentor-content form');
mentorForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  expectedRoleLogin = 'mentor';
  const email    = document.getElementById('mentor-email').value.trim();
  const password = document.getElementById('mentor-password').value;
  const btn      = mentorForm.querySelector('button[type="submit"]');

  if (!email || !password) return;
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    btn.textContent = 'Login as Mentor →'; btn.disabled = false;
    showError(getErrorMessage(err.code));
  }
});

const adminForm = document.querySelector('#tab-admin-content form');
adminForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  expectedRoleLogin = 'admin';
  const email    = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value;
  const btn      = adminForm.querySelector('button[type="submit"]');

  if (!email || !password) return;
  btn.textContent = 'Signing in...'; btn.disabled = true;
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    btn.textContent = 'Login to Admin ERP →'; btn.disabled = false;
    showError(getErrorMessage(err.code));
  }
});

// 3. OTP / RESET PASSWORD
document.getElementById('sendOtpBtn')?.addEventListener('click', async function () {
  const email = document.getElementById('student-email').value.trim();
  if (!email) {
    document.getElementById('student-email').style.borderColor = '#ef4444';
    setTimeout(() => document.getElementById('student-email').style.borderColor = '', 2000);
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    this.textContent = '✓ Reset link sent!';
    this.style.color = '#10b981';
  } catch (err) {
    showError(getErrorMessage(err.code));
  }
});

// 4. PASSWORD TOGGLE
document.querySelector('.toggle-password')?.addEventListener('click', function () {
  const input = document.getElementById('student-password');
  input.type = input.type === 'password' ? 'text' : 'password';
  this.textContent = input.type === 'password' ? '👁' : '🙈';
});

// 5. DASHBOARD PREVIEW TABS
const dashTabs = document.querySelectorAll('.dash-tab');
const dashPanels = document.querySelectorAll('.dash-panel');
dashTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    dashTabs.forEach(t => t.classList.remove('active'));
    dashPanels.forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById(`dash-${tab.dataset.dash}`);
    if (panel) panel.classList.add('active');
  });
});

// 6. MOBILE MENU
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu    = document.getElementById('mobileMenu');
mobileMenuBtn?.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

// 7. NAVBAR SCROLL
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 20 ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.08)';
});

// 8. STATS ANIMATION
const statNumbers = document.querySelectorAll('.stat-number[data-count]');
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = 'true';
      const target = parseInt(entry.target.dataset.count);
      let current = 0;
      const timer = setInterval(() => {
        current += (target / 120);
        if (current >= target) { current = target; clearInterval(timer); }
        entry.target.textContent = target >= 1000 ? Math.floor(current).toLocaleString('en-IN') + '+' : Math.floor(current) + (target === 98 ? '%' : '+');
      }, 16);
    }
  });
}, { threshold: 0.5 });
statNumbers.forEach(el => counterObserver.observe(el));

// 9. SCROLL REVEAL
const revealEls = document.querySelectorAll('.ai-card, .auto-card, .workflow-step');
revealEls.forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
});
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, 100);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObserver.observe(el));

// 10. MODULE SCROLL (Marquee)
const modulesScroll = document.querySelector('.modules-scroll');
if (modulesScroll) {
  let isHovered = false;
  let scrollPos = 0;
  modulesScroll.addEventListener('mouseenter', () => isHovered = true);
  modulesScroll.addEventListener('mouseleave', () => isHovered = false);
  setInterval(() => {
    if (!isHovered) {
      scrollPos += 1;
      if (scrollPos >= modulesScroll.scrollWidth / 2) scrollPos = 0;
      modulesScroll.scrollLeft = scrollPos;
    }
  }, 20);
}

// 11. INJECT ANIMATION CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-5px); }
    80% { transform: translateX(5px); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .hero-section .hero-grid > * {
    animation: slideUp 0.7s ease forwards;
  }
  .hero-section .hero-grid > *:nth-child(1) { animation-delay: 0.1s; }
  .hero-section .hero-grid > *:nth-child(2) { animation-delay: 0.3s; }
`;
document.head.appendChild(style);
