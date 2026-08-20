// ============================================================
// DSATracker — GeeksforGeeks Content Script
// ============================================================

(function() {
  'use strict';
  const PLATFORM = 'GFG';

  function getProblemSlug() {
    const match = window.location.pathname.match(/problems?\/([\w-]+)/);
    return match ? match[1] : '';
  }

  function init() {
    const slug = getProblemSlug();
    if (!slug) return;
    console.log(`[DSATracker] GFG loaded for: ${slug}`);
    chrome.runtime.sendMessage({ type: 'START_SESSION', data: { questionId: slug, platform: PLATFORM } });

    const observer = new MutationObserver(() => {
      const resultElements = document.querySelectorAll('[class*="problems_content"]');
      resultElements.forEach((el) => {
        if (el.dataset.dsaTracked) return;
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('correct') || text.includes('accepted')) {
          el.dataset.dsaTracked = 'true';
          chrome.runtime.sendMessage({ type: 'RECORD_SUBMISSION', data: { questionId: slug, platform: PLATFORM, verdict: 'ACCEPTED' } });
          chrome.runtime.sendMessage({ type: 'END_SESSION' });
        } else if (text.includes('wrong') || text.includes('incorrect')) {
          el.dataset.dsaTracked = 'true';
          chrome.runtime.sendMessage({ type: 'RECORD_SUBMISSION', data: { questionId: slug, platform: PLATFORM, verdict: 'WRONG_ANSWER' } });
        }
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
