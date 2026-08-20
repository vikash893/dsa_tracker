// ============================================================
// DSATracker — CodeChef Content Script
// ============================================================

(function() {
  'use strict';
  const PLATFORM = 'CODECHEF';

  function getProblemId() {
    const match = window.location.pathname.match(/(?:problems|submit)\/([\w]+)/);
    return match ? match[1] : '';
  }

  function init() {
    const problemId = getProblemId();
    if (!problemId) return;
    console.log(`[DSATracker] CodeChef loaded for: ${problemId}`);
    chrome.runtime.sendMessage({ type: 'START_SESSION', data: { questionId: problemId, platform: PLATFORM } });

    const observer = new MutationObserver(() => {
      const resultBanners = document.querySelectorAll('[class*="accepted"], [class*="wrong"], [class*="tle"]');
      resultBanners.forEach((el) => {
        if (el.dataset.dsaTracked) return;
        el.dataset.dsaTracked = 'true';
        const text = el.textContent?.toLowerCase() || '';
        let verdict = 'UNKNOWN';
        if (text.includes('accepted') || text.includes('correct')) verdict = 'ACCEPTED';
        else if (text.includes('wrong')) verdict = 'WRONG_ANSWER';
        else if (text.includes('time')) verdict = 'TIME_LIMIT_EXCEEDED';
        else if (text.includes('runtime')) verdict = 'RUNTIME_ERROR';

        chrome.runtime.sendMessage({ type: 'RECORD_SUBMISSION', data: { questionId: problemId, platform: PLATFORM, verdict } });
        if (verdict === 'ACCEPTED') chrome.runtime.sendMessage({ type: 'END_SESSION' });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
