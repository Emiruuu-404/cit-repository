const urlParams = new URLSearchParams(window.location.search);
const searchParameter = urlParams.get('search');
let abortController = new AbortController();

document.getElementById('searchForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  abortController.abort();
  setTimeout(() => {
    abortController = new AbortController();
    loadSearch();
    generateSummary(document.getElementById('searchInput').value);
  }, 100);
});

setTimeout(() => {
  document.getElementById('nav-smart-search').classList.add('active');
}, 250);

function truncateText(text, maxWords = 30) {
  const words = text.split(' ');
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(' ') + '...';
  }
  return text;
}

async function generateSummary(search) {
  console.log('Generating Summary');
  if (!search || search.length == 0) {
    return;
  }

  const summaryDiv = document.querySelector('#summary');
  summaryDiv.style.display = 'block';
  summaryDiv.innerHTML =
    '<div style="padding: 2em; text-align: center; box-shadow: 0 2px 2px rgba(0,0,0,.3); border-radius: 1em; margin-bottom: 2em;"><em>Generating summary...Patience is a virtue :)</em></div>';
  try {
    const res = await fetch(`/api/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: search }),
      signal: abortController.signal,
    });
    const data = await res.json();
    if (data.summary) {
      summaryDiv.innerHTML = `
        <div style="padding: 2em; border: 1px dotted #eee; margin-bottom: 2em; box-shadow: 0 2px 2px rgba(0,0,0,.2);">
        <h2>✨ AI Overview ✨</h2>
        ${data.summary.replace(/\n/, '<br />')}</div>
      `;
    } else {
      summaryDiv.innerHTML = 'Failed to generate summary.';
    }
  } catch (error) {
    summaryDiv.innerHTML = 'Failed to generate summary.';
  }
}

async function loadSearch(page = 1) {
  const searchQuery = document.getElementById('searchInput').value;
  if (searchQuery === '') return;
  document.title = `Search results for "${searchQuery}"`;
  history.pushState(null, null, `/?search=${encodeURIComponent(searchQuery)}`);
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 'Fetching...';
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await res.json();
  resultsDiv.innerHTML = '';
  if (data.results.length === 0) {
    resultsDiv.innerHTML = 'No results found.';
    return;
  }
  data.results.forEach((r) => {
    const div = document.createElement('div');
    div.classList.add('card', 'mb-2', 'p-2');
    div.innerHTML = `
			<h5><a href="/capstone?id=${r.project_id}">${r.title}</a></h5>
			<p>${truncateText(r.snippets[0])}</p>
			<small>Similarity: ${(r.similarity * 100).toFixed(0)}%</small>
		`;
    resultsDiv.appendChild(div);
  });

  const totalPages = Math.ceil(data.total / data.per_page);
  pagination.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    pagination.innerHTML += `
		<li class="page-item ${i === data.page ? 'active' : ''}">
		<button class="page-link" onclick="loadSearch(${i})">${i}</button>
		</li>`;
  }
}

if (searchParameter) {
  document.getElementById('searchInput').value = searchParameter;
  loadSearch();
  generateSummary(searchParameter);
}
