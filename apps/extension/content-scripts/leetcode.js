// ============================================================
// DSATracker — LeetCode Content Script
// Auto-detects submission results and tracks solving sessions.
// ============================================================

(function() {
  'use strict';

  const PLATFORM = 'LEETCODE';
  let sessionStarted = false;
  let problemSlug = '';

  function getProblemSlug() {
    const match = window.location.pathname.match(/\/problems?\/([\w-]+)/);
    return match ? match[1] : '';
  }

  function init() {
    problemSlug = getProblemSlug();
    if (!problemSlug) return;

    console.log(`[DSATracker] LeetCode content script loaded for: ${problemSlug}`);

    // Notify background to start/resume session
    chrome.runtime.sendMessage({
      type: 'START_SESSION',
      data: { questionId: problemSlug, platform: PLATFORM },
    });
    sessionStarted = true;

    // Watch for submission results
    observeSubmissions();
  }

  function observeSubmissions() {
    // LeetCode shows submission result in a specific container
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          const text = node.textContent || '';

          if (text.includes('Accepted')) {
            reportSubmission('ACCEPTED', node);
          } else if (text.includes('Wrong Answer')) {
            reportSubmission('WRONG_ANSWER', node);
          } else if (text.includes('Time Limit Exceeded')) {
            reportSubmission('TIME_LIMIT_EXCEEDED', node);
          } else if (text.includes('Runtime Error')) {
            reportSubmission('RUNTIME_ERROR', node);
          } else if (text.includes('Compile Error')) {
            reportSubmission('COMPILE_ERROR', node);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  function reportSubmission(verdict, node) {
    // Extract runtime/memory if available
    const runtimeMatch = node.textContent?.match(/(\d+)\s*ms/);
    const memoryMatch = node.textContent?.match(/([\d.]+)\s*MB/);

    chrome.runtime.sendMessage({
      type: 'RECORD_SUBMISSION',
      data: {
        questionId: problemSlug,
        platform: PLATFORM,
        verdict,
        executionTime: runtimeMatch ? parseInt(runtimeMatch[1]) : undefined,
        memory: memoryMatch ? parseFloat(memoryMatch[1]) : undefined,
        language: detectLanguage(),
      },
    });

    if (verdict === 'ACCEPTED') {
      chrome.runtime.sendMessage({ type: 'END_SESSION' });
      showSuccessBanner();
    }
  }

  function detectLanguage() {
    // Try to detect selected language from the editor
    const langButton = document.querySelector('[class*="language"]') ||
                       document.querySelector('button[id*="lang"]');
    return langButton?.textContent?.trim() || 'Unknown';
  }

  function showSuccessBanner() {
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed; top: 10px; right: 10px; z-index: 99999;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white; padding: 12px 20px; border-radius: 12px;
      font-family: system-ui; font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 20px rgba(99,102,241,0.4);
      animation: slideIn 0.3s ease-out;
    `;
    banner.textContent = '🏆 DSATracker: Submission recorded!';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 3000);
  }

  // Start when DOM is ready
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
