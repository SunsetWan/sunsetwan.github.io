export function initializeReadingToc(document = globalThis.document) {
  document.querySelectorAll('details.toc-mobile').forEach(details => {
    details.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = event.target?.closest?.('a[href^="#"]');
      if (!link || !details.contains(link) || link.hasAttribute('download')) return;
      const target = (link.getAttribute('target') || '').toLowerCase();
      if (target && target !== '_self') return;

      let headingId;
      try {
        headingId = decodeURIComponent(link.getAttribute('href').slice(1));
      } catch {
        return;
      }
      if (!document.getElementById(headingId)) return;

      // Close before the browser measures the fragment target. Native navigation
      // keeps the URL, history, and keyboard navigation behavior intact.
      details.open = false;
    });
  });
}
