const tableBody = document.getElementById('capstoneTable');
const wordDocumentInput = document.getElementById('wordFile');
const uploadResultDiv = document.getElementById('upload-result');

setTimeout(() => {
  document.getElementById('nav-manage-capstones').classList.add('active');
}, 250);

function importModal() {
  new bootstrap.Modal(document.getElementById('importModal')).show();
  uploadResultDiv.innerHTML = '';
}

document.getElementById('uploadBtn').addEventListener('click', () => {
  wordDocumentInput.click();
});

wordDocumentInput.addEventListener('change', async () => {
  if (!wordDocumentInput.files.length) return;
  const formData = new FormData();
  formData.append('file', wordDocumentInput.files[0]);
  uploadResultDiv.innerHTML = `<div class="text-info">⏳ Uploading...</div>`;
  try {
    const res = await fetch('/api/capstones/upload-docx', {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const errorData = await res.json();
      alert('Upload failed: ' + errorData.detail);
      throw new Error(errorData.detail || 'Upload failed');
    }

    const data = await res.json();
    let html = `
            <div class="alert alert-success">✅ Inserted: ${data.inserted.length}</div>
            <div class="alert alert-warning">⚠️ Skipped: ${data.skipped.length}</div>
        `;
    if (data.skipped.length > 0) {
      html += `<ul class="list-group text-start">`;
      data.skipped.forEach((s) => {
        html += `<li class="list-group-item">${s.title || '(No Title)'} – ${
          s.reason
        }</li>`;
      });
      html += `</ul>`;
    }
    uploadResultDiv.innerHTML = html;
    loadCapstones();
  } catch (err) {
    uploadResultDiv.innerHTML = `<div class="alert alert-danger">❌ Error: ${err.message}</div>`;
  } finally {
    wordDocumentInput.value = '';
  }
});

function addCapModal() {
  new bootstrap.Modal(document.getElementById('addModal')).show();
}

document.getElementById('addCapstone').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Adding...';
  const res = await fetch('/api/capstones', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const data = await res.json();
  console.log(data);
  if (res.ok) {
    if (data.status === 'error') {
      alert(data.message);
      btn.disabled = false;
      btn.textContent = 'Add Capstone';
      return;
    }

    form.reset();
    bootstrap.Modal.getInstance(document.getElementById('addModal')).hide();
    loadCapstones();
  } else {
    alert('Failed to add capstone!');
  }
  btn.disabled = false;
  btn.textContent = 'Add Capstone';
});

async function loadCapstones(page = 1, currentSearch = '') {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  const res = await fetch(`/api/capstones?page=${page}&q=${currentSearch}`);
  const data = await res.json();

  tableBody.innerHTML = '';

  if (data.results.length === 0) {
    tableBody.innerHTML = `<td colspan="4">No results found<td>`;
    return;
  }
  data.results.forEach((c) => {
    const row = document.createElement('tr');
    row.innerHTML = `
            <td>${c.title}</td>
            <td>${c.authors}</td>
            <td>${c.year}</td>
            <td>
            ${
              c.external_links
                ? c.external_links
                    .split(',')
                    .map(
                      (link) => `<a href="${link}" target="_blank">${link}</a>`
                    )
                    .join('<br/>')
                : ''
            }
            </td>
            <td>
            <button class="btn btn-warning btn-sm mb-1" onclick="openEdit(${
              c.id
            })" title="Edit Capstone">
                <img src="/static/icons/pencil.svg">
            </button>
            <button class="btn btn-danger btn-sm mb-1" onclick="deleteCapstone(${
              c.id
            })" title="Delete Capstone">
                <img src="/static/icons/trash-can.svg">
            </button>
            </td>
        `;
    tableBody.appendChild(row);
    pagination.innerHTML = '';
    const totalPages = Math.ceil(data.total / data.per_page);
    for (let i = 1; i <= totalPages; i++) {
      pagination.innerHTML += `
            <li class="page-item ${i === data.page ? 'active' : ''}">
                <button class="page-link" onclick="loadCapstones(${i},${encodeURIComponent(
        currentSearch
      )})">${i}</button>
            </li>`;
    }
  });
}

function doSearch() {
  const currentSearch = document.getElementById('searchBox').value;
  loadCapstones(1, currentSearch);
}

async function openEdit(id) {
  const res = await fetch(`/api/capstones/${id}`);
  const c = await res.json();
  document.getElementById('editId').value = c.id;
  document.getElementById('editTitle').value = c.title;
  document.getElementById('editAbstract').value = c.abstract;
  document.getElementById('editAuthors').value = c.authors.join(', ');
  document.getElementById('editYear').value = c.year;
  document.getElementById('editLink').value = c.external_links;
  document.getElementById('editKeywords').value = c.keywords.join(', ');
  new bootstrap.Modal(document.getElementById('editModal')).show();
}

document
  .getElementById('editCapstone')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editId').value;
    const editForm = document.getElementById('editCapstone');
    const formData = new FormData(editForm);
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const res = await fetch(`/api/capstones/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: formData,
    });
    if (res.ok) {
      loadCapstones();
      bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    } else {
      alert('Failed to update capstone!');
    }
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  });

document
  .getElementById('deleteCapstone')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('deleteId').value;
    const btn = e.target.querySelector('button[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Deleting...';
    const res = await fetch(`/api/capstones/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      loadCapstones();
      bootstrap.Modal.getInstance(
        document.getElementById('deleteModal')
      ).hide();
    } else {
      alert('Failed to delete capstone!');
    }
    btn.disabled = false;
    btn.textContent = 'Delete';
  });

async function deleteCapstone(id) {
  new bootstrap.Modal(document.getElementById('deleteModal')).show();
  // if (!confirm("Are you sure you want to delete this capstone?")) return;
  document.getElementById('deleteId').value = id;
}

loadCapstones();
