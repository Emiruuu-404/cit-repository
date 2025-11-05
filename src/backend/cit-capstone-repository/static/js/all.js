let debounceTimer;
function debounce(callback, delay=500) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(callback, delay);
}

const navBarItems = document.getElementById("navbarItems");

async function updateNavbar() {
    const navBarItems = document.getElementById("navbarItems");
    try {
        const res = await fetch("/api/users/current", { credentials: "include" });
        const data = await res.json();

        const items = [];
        items.push({ id:"nav-smart-search", text: "Smart Search", href: "/" });
        
        if (data.email !== null) {
            if (data.role === "Admin" || data.role === "Staff") {
                items.unshift({ id:"nav-manage-capstones", text: "Manage Capstones", href: "/manage-capstones" });
            }
            if (data.role === "Admin") {
                items.splice(1, 0, { id:"nav-manage-users", text: "Manage Users", href: "/manage-users" });
            }
            items.push({ id:"nav-logout", text: "Logout", href: "/logout" });
        } else {
            items.push({ id:"nav-login", text: "Login", href: "/login" });
        }
        
        navBarItems.innerHTML = items.map(i => `
            <li class="nav-item">
                <a class="nav-link" id="${i.id}" href="${i.href}">${i.text}</a>
            </li>
        `).join("");

    } catch (err) {
        console.error("Failed to update navbar", err);
    }
}

updateNavbar();
