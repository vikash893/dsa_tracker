// ============================================================
// DSATracker Chrome Extension — Popup Script
// ============================================================

const $ = (sel) => document.querySelector(sel);

// ─── Views ──────────────────────────────────────────────────

function showView(viewId) {
  document.querySelectorAll('.view').forEach((v) => v.classList.add('hidden'));
  $(`#${viewId}`).classList.remove('hidden');
}

// ─── Init ───────────────────────────────────────────────────

async function init() {
  const { user } = await chrome.storage.local.get('user');
  if (user) {
    showDashboard(user);
  } else {
    showView('login-view');
  }
}

// ─── Login ──────────────────────────────────────────────────

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('#email').value;
  const password = $('#password').value;
  const errorEl = $('#login-error');
  const btn = $('#login-btn');

  btn.textContent = 'Signing in...';
  btn.disabled = true;
  errorEl.textContent = '';

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'LOGIN',
      data: { email, password },
    });

    if (result.success) {
      showDashboard(result.data.user);
    } else {
      errorEl.textContent = result.message || 'Login failed';
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Connection error';
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
});

// ─── Dashboard ──────────────────────────────────────────────

async function showDashboard(user) {
  showView('dashboard-view');

  $('#user-name').textContent = user.displayName || `${user.firstName} ${user.lastName}`;
  $('#user-role').textContent = user.role.replace('_', ' ');

  // Load analytics
  try {
    const analytics = await chrome.runtime.sendMessage({ type: 'GET_ANALYTICS' });
    if (analytics.success) {
      const d = analytics.data;
      $('#stat-solved').textContent = d.solved || 0;
      $('#stat-streak').textContent = d.currentStreak || 0;
      $('#stat-accuracy').textContent = `${d.accuracy || 0}%`;
      $('#stat-xp').textContent = d.xp || 0;
    }
  } catch { /* offline */ }

  // Load assignments
  try {
    const assignments = await chrome.runtime.sendMessage({ type: 'GET_ASSIGNMENTS' });
    if (assignments.success && assignments.data?.length > 0) {
      const list = $('#assignments-list');
      list.innerHTML = assignments.data.map((a) => `
        <div class="assignment-item" data-url="${a.questionId?.problemUrl || '#'}">
          <span>${a.questionId?.title || 'Unknown'}</span>
          <span class="difficulty ${a.questionId?.difficulty || ''}">${a.questionId?.difficulty || '?'}</span>
        </div>
      `).join('');

      list.querySelectorAll('.assignment-item').forEach((item) => {
        item.addEventListener('click', () => {
          const url = item.dataset.url;
          if (url && url !== '#') chrome.tabs.create({ url });
        });
      });
    }
  } catch { /* offline */ }
}

// ─── Logout ─────────────────────────────────────────────────

$('#logout-btn').addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'LOGOUT' });
  showView('login-view');
  $('#email').value = '';
  $('#password').value = '';
});

// ─── Session Controls ───────────────────────────────────────

$('#pause-btn')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'PAUSE_SESSION' });
});

$('#end-btn')?.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'END_SESSION' });
  $('#session-card').classList.add('hidden');
});

// ─── Start ──────────────────────────────────────────────────

init();
