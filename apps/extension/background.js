// ============================================================
// DSATracker Chrome Extension — Background Service Worker
// ============================================================

const API_BASE = 'https://dsatracker-api-u457.onrender.com/api';

// ─── Token Management ───────────────────────────────────────

async function getToken() {
  const { accessToken } = await chrome.storage.local.get('accessToken');
  return accessToken;
}

async function setToken(token) {
  await chrome.storage.local.set({ accessToken: token });
}

async function apiRequest(endpoint, options = {}) {
  const token = await getToken();
  if (!token && !endpoint.includes('/auth/login')) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'API Error');
  return data;
}

// ─── Session Management ─────────────────────────────────────

let activeTimers = {};

async function startSession(questionId, tabId, platform) {
  try {
    const result = await apiRequest('/sessions/start', {
      method: 'POST',
      body: JSON.stringify({ questionId, tabId, platform }),
    });

    const sessionId = result.data._id;
    activeTimers[tabId] = { sessionId, questionId, startTime: Date.now() };

    // Set inactivity alarm (5 minutes)
    chrome.alarms.create(`inactivity-${tabId}`, { delayInMinutes: 5 });

    // Update badge
    chrome.action.setBadgeText({ text: '⏱️' });
    chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

    return result;
  } catch (err) {
    console.error('Failed to start session:', err);
    return null;
  }
}

async function pauseSession(tabId) {
  const timer = activeTimers[tabId];
  if (!timer) return;

  try {
    await apiRequest(`/sessions/${timer.sessionId}/pause`, { method: 'POST' });
    chrome.alarms.clear(`inactivity-${tabId}`);
    chrome.action.setBadgeText({ text: '⏸️' });
  } catch (err) {
    console.error('Failed to pause session:', err);
  }
}

async function endSession(tabId) {
  const timer = activeTimers[tabId];
  if (!timer) return;

  try {
    await apiRequest(`/sessions/${timer.sessionId}/end`, { method: 'POST' });
    delete activeTimers[tabId];
    chrome.alarms.clear(`inactivity-${tabId}`);
    chrome.action.setBadgeText({ text: '' });
  } catch (err) {
    console.error('Failed to end session:', err);
  }
}

// ─── Submission Recording ───────────────────────────────────

async function recordSubmission(data) {
  try {
    return await apiRequest('/submissions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        source: 'EXTENSION_AUTO',
      }),
    });
  } catch (err) {
    console.error('Failed to record submission:', err);
    // Store locally for retry
    const { pendingSubmissions = [] } = await chrome.storage.local.get('pendingSubmissions');
    pendingSubmissions.push({ ...data, timestamp: Date.now() });
    await chrome.storage.local.set({ pendingSubmissions });
  }
}

// ─── Message Handling ───────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = async () => {
    switch (message.type) {
      case 'LOGIN': {
        const result = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify(message.data),
        });
        await setToken(result.data.accessToken);
        await chrome.storage.local.set({ user: result.data.user });
        return result;
      }
      case 'LOGOUT': {
        await chrome.storage.local.clear();
        chrome.action.setBadgeText({ text: '' });
        return { success: true };
      }
      case 'GET_USER': {
        const { user } = await chrome.storage.local.get('user');
        return { success: true, data: { user } };
      }
      case 'START_SESSION':
        return startSession(message.data.questionId, sender.tab?.id, message.data.platform);
      case 'PAUSE_SESSION':
        return pauseSession(sender.tab?.id);
      case 'END_SESSION':
        return endSession(sender.tab?.id);
      case 'RECORD_SUBMISSION':
        return recordSubmission(message.data);
      case 'GET_ANALYTICS':
        return apiRequest('/analytics/me');
      case 'GET_ASSIGNMENTS':
        return apiRequest('/assignments?status=NOT_STARTED&status=IN_PROGRESS&limit=10');
      case 'GET_ACTIVE_SESSION': {
        const tabTimer = activeTimers[sender.tab?.id];
        return { success: true, data: tabTimer || null };
      }
      default:
        return { success: false, message: 'Unknown message type' };
    }
  };

  handler().then(sendResponse).catch((err) => sendResponse({ success: false, message: err.message }));
  return true; // Keep message channel open for async
});

// ─── Tab Events ─────────────────────────────────────────────

chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTimers[tabId]) {
    endSession(tabId);
  }
});

// ─── Alarms ─────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith('inactivity-')) {
    const tabId = parseInt(alarm.name.split('-')[1]);
    pauseSession(tabId);

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'DSATracker — Session Paused',
      message: 'Your solving session was paused due to inactivity.',
    });
  }
});

console.log('DSATracker background service worker started');
