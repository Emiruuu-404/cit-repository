const urlParams = new URLSearchParams(window.location.search);
const capstoneId = urlParams.get('id');
const content = document.getElementById('content');

setTimeout(() => {
  document.getElementById('nav-smart-search').classList.add('active');
}, 250);

if (capstoneId == null) {
  window.location.href = '/';
}

async function loadCapstoneById(id) {
  const res = await fetch(`/api/capstones/${id}`);
  const data = await res.json();

  if (!res.ok) {
    content.innerHTML = `
            <div class="alert alert-warning" role="alert">
                <h3>Ooops! An error occured</h3>
                <p>Capstone can't be found at this moment.</p>
            </div>
        `;
    return;
  }

  document.title = `${data.title} - CIT Capstone Project Repository`;
  content.innerHTML = `
        <h1 class="mt-5">${data.title}</h1>
        <p class="mt-5">Author(s): ${data.authors}</p>
        <p>Year: ${data.year}</p>
        <p>Keywords: ${data.keywords.join(', ')}</p>
        <p class="mt-5">${data.abstract}</p>
        ${
          data.external_link
            ? `<a href="${data.external_link}" target="_blank">Link</a>`
            : ''
        }
    `;
}

loadCapstoneById(capstoneId);
