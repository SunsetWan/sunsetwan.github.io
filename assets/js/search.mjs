function score(post, query) {
  const word = /^[a-z0-9]{1,3}$/.test(query) ? new RegExp(`\\b${query}\\b`, 'i') : null;
  const contains = value => word
    ? word.test(String(value || ''))
    : String(value || '').toLowerCase().includes(query);
  let rank = 0;
  if (contains(post.title)) rank += 8;
  if ((post.tags || []).some(contains)) rank += 4;
  if (contains(post.excerpt)) rank += 2;
  if (contains(post.content)) rank += 1;
  return rank;
}

export function createSearchController({ loadIndex, onResults, onError, onClear }) {
  let index;
  let pendingIndex;
  let queryVersion = 0;

  function getIndex() {
    if (index) return Promise.resolve(index);
    if (!pendingIndex) {
      pendingIndex = Promise.resolve().then(loadIndex).then(data => {
        if (!Array.isArray(data)) throw new Error('Invalid search index');
        index = data;
        return index;
      }).finally(() => { pendingIndex = undefined; });
    }
    return pendingIndex;
  }

  return async function search(value) {
    const version = ++queryVersion;
    const query = value.trim();
    if (!query) {
      onClear();
      return;
    }

    try {
      const posts = await getIndex();
      // An old request must not restore results after the user types or clears.
      if (version !== queryVersion) return;
      const normalizedQuery = query.toLowerCase();
      const hits = posts.map(post => ({ post, rank: score(post, normalizedQuery) }))
        .filter(hit => hit.rank > 0)
        .sort((first, second) => second.rank - first.rank)
        .map(hit => hit.post);
      onResults(hits, query);
    } catch {
      if (version === queryVersion) onError();
    }
  };
}

function escapeHTML(value) {
  const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return String(value || '').replace(/[&<>"']/g, character => entities[character]);
}

export function initializeSearch() {
  const input = document.getElementById('search-input');
  const list = document.getElementById('search-results');
  if (!input || !list) return;
  const maxResults = Number(input.dataset.maxResults) || 8;

  function showMessage(message) {
    list.innerHTML = '<li class="search-empty">' + escapeHTML(message) + '</li>';
    list.hidden = false;
  }

  const search = createSearchController({
    async loadIndex() {
      const response = await fetch(input.dataset.indexUrl);
      if (!response.ok) throw new Error('Search index request failed');
      return response.json();
    },
    onResults(posts, query) {
      if (!posts.length) {
        showMessage(input.dataset.noResults.replace('{query}', query));
        return;
      }
      list.innerHTML = posts.slice(0, maxResults).map(post =>
        '<li class="search-result">' +
          '<a href="' + escapeHTML(post.url) + '">' +
            '<span class="search-result-body">' +
              '<span class="search-result-title">' + escapeHTML(post.title) + '</span>' +
              (post.excerpt ? '<span class="search-result-excerpt">' + escapeHTML(post.excerpt) + '</span>' : '') +
            '</span>' +
            '<span class="search-result-date">' + escapeHTML(post.date) + '</span>' +
          '</a></li>'
      ).join('');
      list.hidden = false;
    },
    onError() { showMessage(input.dataset.loadError); },
    onClear() {
      list.hidden = true;
      list.innerHTML = '';
    }
  });
  input.addEventListener('input', () => { search(input.value); });
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) search(input.value);
  });
  if (input.value.trim()) search(input.value);
}
