// ============================================================
// DSATracker — Codeforces Content Script
// ============================================================

(function() {
  'use strict';
  const PLATFORM = 'CODEFORCES';

  function getProblemId() {
    const match = window.location.pathname.match(/problem\/(\d+)\/([A-Z]\d?)/);
    return match ? `${match[1]}${match[2]}` : '';
  }

  function init() {
    const problemId = getProblemId();
    if (!problemId) return;
    console.log(`[DSATracker] Codeforces loaded for: ${problemId}`);
    chrome.runtime.sendMessage({ type: 'START_SESSION', data: { questionId: problemId, platform: PLATFORM } });
    observeSubmissions(problemId);
  }

  function observeSubmissions(problemId) {
    // Watch submission table for verdict updates
    const observer = new MutationObserver(() => {
      const verdictCells = document.querySelectorAll('.verdict-accepted, .verdict-rejected');
      verdictCells.forEach((cell) => {
        if (cell.dataset.dsaTracked) return;
        cell.dataset.dsaTracked = 'true';
        const verdict = cell.classList.contains('verdict-accepted') ? 'ACCEPTED' : 'WRONG_ANSWER';
        chrome.runtime.sendMessage({
          type: 'RECORD_SUBMISSION',
          data: { questionId: problemId, platform: PLATFORM, verdict },
        });
        if (verdict === 'ACCEPTED') chrome.runtime.sendMessage({ type: 'END_SESSION' });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
