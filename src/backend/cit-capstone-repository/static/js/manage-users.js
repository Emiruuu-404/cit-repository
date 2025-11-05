const userTableBody = document.getElementById("userTable");
const userCsvInput = document.getElementById("csvUserFile");
const uploadUserResultDiv = document.getElementById("upload-user-result");

setTimeout(()=>{
    document.getElementById("nav-manage-users").classList.add("active");
}, 250);

function importUserModal() {
    new bootstrap.Modal(document.getElementById("importUserModal")).show();
    uploadUserResultDiv.innerHTML = "";
}

document.getElementById("uploadUserBtn").addEventListener("click", () => {
    userCsvInput.click();
});

userCsvInput.addEventListener("change", async () => {
    if (!userCsvInput.files.length) return;
    const formData = new FormData();
    formData.append("file", userCsvInput.files[0]);
    uploadUserResultDiv.innerHTML = `<div class="text-info">⏳ Uploading...</div>`;
    try {
        const res = await fetch("/api/users/import-csv", {
            method: "POST",
            credentials: "include",
            body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Upload failed");

        let html = `
            <div class="alert alert-success">✅ Inserted: ${data.inserted.length}</div>
            <div class="alert alert-warning">⚠️ Skipped: ${data.skipped.length}</div>
        `;
        if (data.skipped.length > 0) {
            html += `<ul class="list-group text-start">`;
            data.skipped.forEach((s) => {
                html += `<li class="list-group-item">${s.email || "(No Email)"} – ${s.reason}</li>`;
            });
            html += `</ul>`;
        }
        uploadUserResultDiv.innerHTML = html;
        loadUsers();
    } catch (err) {
        uploadUserResultDiv.innerHTML = `<div class="alert alert-danger">❌ Error: ${err.message}</div>`;
    } finally {
        userCsvInput.value = "";
    }
});

function addUserModal() {
    new bootstrap.Modal(document.getElementById("addUserModal")).show();
}

document.getElementById("addUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Adding...";
    const res = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        body: formData
    });
    if (res.ok) {
        form.reset();
        bootstrap.Modal.getInstance(document.getElementById("addUserModal")).hide();
        loadUsers();
    } else {
        alert("Failed to add user!");
    }
    btn.disabled = false;
    btn.textContent = "Add User";
});

async function loadUsers(page=1,currentSearch="") {
    const pagination = document.getElementById("userPagination");
    pagination.innerHTML = "";
    
    const res = await fetch(`/api/users?page=${page}&per_page=10&search=${encodeURIComponent(currentSearch)}`);
    const data = await res.json();
    
    userTableBody.innerHTML = "";
    
    if (data.results.length === 0) {
        userTableBody.innerHTML = `<td colspan="2">No results found<td>`;
        return;
    }
    data.results.forEach(u => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${u.email}</td>
            <td>${u.role}</td>
            <td>
            <button class="btn btn-warning btn-sm mb-1" onclick="openEditUser(${u.id})" title="Edit User">
                <img src="/static/icons/pencil.svg">
            </button>
            <button class="btn btn-danger btn-sm mb-1" onclick="deleteUser(${u.id})" title="Delete User">
                <img src="/static/icons/trash-can.svg">
            </button>
            <button class="btn btn-secondary btn-sm mb-1" onclick="changePassword(${u.id})" title="Change Password">
                <img src="/static/icons/key.svg">
            </button>
            </td>
        `;
        userTableBody.appendChild(row);
    });

    const totalPages = Math.ceil(data.total / data.per_page);
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
        <li class="page-item ${i === data.page ? "active" : ""}">
            <button class="page-link" onclick="loadUsers(${i},'${currentSearch}')">${i}</button>
        </li>`;
    }
}

function doUserSearch() {
    const currentSearch = document.getElementById("searchUserBox").value;
    loadUsers(1, currentSearch);
}

async function openEditUser(id) {
    const res = await fetch(`/api/users/${id}`);
    const u = await res.json();
    document.getElementById("editUserId").value = u.id;
    document.getElementById("editEmail").value = u.email;
    document.getElementById("editRole").value = u.role;
    new bootstrap.Modal(document.getElementById("editUserModal")).show();
}

document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editUserId").value;
    const editForm = document.getElementById("editUserForm");
    const formData = new FormData(editForm);
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Saving...";
    
    const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        credentials: "include",
        body: formData
    });
    if (res.ok) {
        loadUsers();
        bootstrap.Modal.getInstance(document.getElementById("editUserModal")).hide();
    } else {
        alert("Failed to update user!");
    }
    btn.disabled = false;
    btn.textContent = "Save Changes";
});

document.getElementById("deleteUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("deleteUserId").value;
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Deleting...";
    const res = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) {
        loadUsers();
        bootstrap.Modal.getInstance(document.getElementById("deleteUserModal")).hide();
    } else {
        alert("Failed to delete user!");
    }
    btn.disabled = false;
    btn.textContent = "Delete";
});

async function deleteUser(id) {
    new bootstrap.Modal(document.getElementById("deleteUserModal")).show();
    document.getElementById("deleteUserId").value = id;
}

document.getElementById("changePasswordForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("deleteUserId").value;
    const btn = e.target.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Deleting...";
    /*
    const res = await fetch(`/api/users/changepassword/${id}`, { method: "PUT", credentials: "include" });
    if (res.ok) {
        loadUsers();
        bootstrap.Modal.getInstance(document.getElementById("changePasswordModal")).hide();
    } else {
        alert("Failed to change password!");
    }
    */
    btn.disabled = false;
    btn.textContent = "Delete";
});

async function changePassword(id) {
    new bootstrap.Modal(document.getElementById("changePasswordModal")).show();
    document.getElementById("changePasswordId").value = id;
}

loadUsers();
