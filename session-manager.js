/**
 * RONE MentorOS - Session Timeout Manager
 *
 * Behavior:
 *   - After 7 minutes of inactivity → show warning modal with 3-min countdown
 *   - If user clicks "Continue Session" → reset timers, hide modal
 *   - If countdown reaches 0:00 → auto logout + redirect to login page
 *
 * Usage (inside any dashboard <script type="module">):
 *   import { initSessionManager } from '../session-manager.js';
 *   initSessionManager(auth, signOut, '../index.html');
 *
 * Fixes (v2):
 *   - Throttled mousemove/scroll to avoid constant timer resets
 *   - Guard flag (_isWarningActive) to prevent double-starting countdown
 *   - Double-init prevention (window._sessionManagerInitialized)
 *   - Page Visibility API: tab switch se galat behavior fix
 *   - Clean state reset on every modal open/close
 */

const INACTIVITY_LIMIT_MS  = 7 * 60 * 1000;  // 7 minutes
const WARNING_DURATION_MS  = 3 * 60 * 1000;  // 3-minute countdown
const WARNING_DURATION_SEC = 3 * 60;          // 180 seconds
const THROTTLE_MS          = 1000;            // Throttle activity events to 1/sec

let inactivityTimer  = null;
let countdownTimer   = null;
let secondsLeft      = WARNING_DURATION_SEC;
let _authInstance    = null;
let _signOutFn       = null;
let _redirectPath    = '../index.html';
let _lastActivity    = Date.now();
let _isWarningActive = false;  // Single source of truth for modal state

// ─── Inject Modal HTML + CSS once ─────────────────────────────────────────────
function injectModal() {
  if (document.getElementById('session-timeout-overlay')) return;

  const style = document.createElement('style');
  style.textContent = `
    #session-timeout-overlay {
      position: fixed; inset: 0; z-index: 99999;
      display: none;
      align-items: center; justify-content: center;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      animation: fadeInBg 0.3s ease;
    }
    #session-timeout-overlay.active { display: flex; }

    @keyframes fadeInBg {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    #session-timeout-card {
      background: white;
      border-radius: 20px;
      padding: 40px 36px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0,0,0,0.25);
      animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
    }

    #session-timeout-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, #f59e0b, #ef4444);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px) scale(0.95); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    .session-icon {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 2rem;
      margin: 0 auto 20px;
      box-shadow: 0 4px 16px rgba(245,158,11,0.25);
    }

    .session-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px;
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    }

    .session-subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0 0 24px;
      line-height: 1.5;
    }

    .session-countdown-ring {
      position: relative;
      width: 100px; height: 100px;
      margin: 0 auto 28px;
    }

    .session-countdown-ring svg {
      transform: rotate(-90deg);
    }

    .session-countdown-ring circle.bg {
      fill: none;
      stroke: #f1f5f9;
      stroke-width: 8;
    }

    .session-countdown-ring circle.progress {
      fill: none;
      stroke: #ef4444;
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: 251.2;
      stroke-dashoffset: 0;
      transition: stroke-dashoffset 1s linear, stroke 0.5s;
    }

    .session-countdown-number {
      position: absolute;
      inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem;
      font-weight: 700;
      color: #ef4444;
      font-family: 'Space Grotesk', 'Inter', monospace;
    }

    .session-btn-continue {
      width: 100%;
      padding: 13px 20px;
      background: linear-gradient(135deg, #1a1f5e, #3b4cc0);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      margin-bottom: 10px;
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    }

    .session-btn-continue:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 20px rgba(26,31,94,0.35);
    }

    .session-btn-logout {
      background: none;
      border: 1px solid #e2e8f0;
      color: #64748b;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 0.9rem;
      cursor: pointer;
      width: 100%;
      transition: all 0.2s;
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
    }

    .session-btn-logout:hover {
      background: #fef2f2;
      border-color: #ef4444;
      color: #ef4444;
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.id = 'session-timeout-overlay';
  overlay.innerHTML = `
    <div id="session-timeout-card">
      <div class="session-icon">⏳</div>
      <h2 class="session-title">Session Expiring Soon</h2>
      <p class="session-subtitle">
        You've been inactive for a while.<br>
        Your session will automatically end in:
      </p>
      <div class="session-countdown-ring">
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle class="bg" cx="50" cy="50" r="40"/>
          <circle class="progress" id="session-ring-progress" cx="50" cy="50" r="40"/>
        </svg>
        <div class="session-countdown-number" id="session-countdown-text">3:00</div>
      </div>
      <button class="session-btn-continue" id="session-btn-continue">
        ✅ Continue Session
      </button>
      <button class="session-btn-logout" id="session-btn-logout">
        Sign Out Now
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Button listeners
  document.getElementById('session-btn-continue').addEventListener('click', window.dismissSessionWarning);
  document.getElementById('session-btn-logout').addEventListener('click', performLogout);
}

// ─── Show Warning Modal ────────────────────────────────────────────────────────
function showWarningModal() {
  // FIX: Guard — don't start again if already showing
  if (_isWarningActive) return;
  _isWarningActive = true;

  const overlay = document.getElementById('session-timeout-overlay');
  if (!overlay) return;

  // FIX: Always cleanly stop any stale countdown before starting fresh
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  secondsLeft = WARNING_DURATION_SEC;

  overlay.classList.add('active');
  updateCountdownUI();

  countdownTimer = setInterval(() => {
    secondsLeft--;
    updateCountdownUI();
    if (secondsLeft <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      performLogout();
    }
  }, 1000);
}

// ─── Update Countdown Ring + Number ───────────────────────────────────────────
function updateCountdownUI() {
  const textEl     = document.getElementById('session-countdown-text');
  const progressEl = document.getElementById('session-ring-progress');
  if (!textEl || !progressEl) return;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  textEl.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

  // Stroke dashoffset: 251.2 = full circle circumference (2π×40)
  const ratio = secondsLeft / WARNING_DURATION_SEC;
  progressEl.style.strokeDashoffset = 251.2 * (1 - ratio);

  // Color shift: green → orange → red
  if (ratio > 0.6)      progressEl.style.stroke = '#10b981';
  else if (ratio > 0.3) progressEl.style.stroke = '#f59e0b';
  else                  progressEl.style.stroke = '#ef4444';

  const numEl = document.getElementById('session-countdown-number');
  if (numEl) numEl.style.color = progressEl.style.stroke;
}

// ─── Perform Logout ────────────────────────────────────────────────────────────
async function performLogout() {
  // FIX: Stop all timers before logout
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
  _isWarningActive = false;
  try {
    if (_authInstance && _signOutFn) {
      await _signOutFn(_authInstance);
    }
  } catch (e) {
    console.error('Session logout error:', e);
  }
  window.location.href = _redirectPath;
}

// ─── Reset Session Timer (throttled, called on any user activity) ──────────────
function resetSessionTimer() {
  // FIX: If warning modal is active, ignore all background activity
  if (_isWarningActive) return;

  // FIX: Throttle — only reset once per second to avoid performance issues
  const now = Date.now();
  if (now - _lastActivity < THROTTLE_MS) return;
  _lastActivity = now;

  // Clear any stale countdown (failsafe)
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }

  // Reset inactivity timer
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(showWarningModal, INACTIVITY_LIMIT_MS);
}

// ─── Global: Continue Session button ──────────────────────────────────────────
window.dismissSessionWarning = function() {
  const overlay = document.getElementById('session-timeout-overlay');
  if (overlay) overlay.classList.remove('active');

  // FIX: Clean stop of countdown
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
  secondsLeft      = WARNING_DURATION_SEC;
  _isWarningActive = false;       // FIX: Release the guard
  _lastActivity    = Date.now();  // FIX: Mark as just-active

  // Restart inactivity timer fresh
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(showWarningModal, INACTIVITY_LIMIT_MS);
};

// ─── Page Visibility API — handle tab switching ────────────────────────────────
function handleVisibilityChange() {
  if (document.hidden) {
    // Tab hidden — suspend inactivity timer to avoid firing in background
    if (inactivityTimer && !_isWarningActive) {
      clearTimeout(inactivityTimer);
      inactivityTimer = null;
    }
  } else {
    // Tab visible again
    if (!_isWarningActive && !inactivityTimer) {
      const hiddenFor = Date.now() - _lastActivity;
      if (hiddenFor >= INACTIVITY_LIMIT_MS) {
        // Been away too long — show warning immediately
        showWarningModal();
      } else {
        // Resume timer for remaining time
        const remaining = INACTIVITY_LIMIT_MS - hiddenFor;
        inactivityTimer = setTimeout(showWarningModal, remaining);
      }
    }
    _lastActivity = Date.now();
  }
}

// ─── Public Init Function ──────────────────────────────────────────────────────
export function initSessionManager(authInstance, signOutFunction, redirectPath = '../index.html') {
  // FIX: Prevent double-initialization (e.g., if called multiple times)
  if (window._sessionManagerInitialized) {
    console.warn('⚠️ Session Manager already initialized, skipping.');
    return;
  }
  window._sessionManagerInitialized = true;

  _authInstance  = authInstance;
  _signOutFn     = signOutFunction;
  _redirectPath  = redirectPath;

  // Inject modal DOM
  injectModal();

  // FIX: Track user activity — throttled events separately from instant events
  const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll', 'click', 'touchmove'];
  activityEvents.forEach(event => {
    document.addEventListener(event, resetSessionTimer, { passive: true });
  });

  // FIX: Page visibility support (tab switching)
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Start the initial inactivity timer
  _lastActivity   = Date.now();
  inactivityTimer = setTimeout(showWarningModal, INACTIVITY_LIMIT_MS);

  console.log('✅ Session Manager initialized (v2): 7min inactivity → 3min warning → auto logout');
}
