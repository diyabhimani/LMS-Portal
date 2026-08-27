async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  let data = {};
  try { data = await response.json(); } catch (_) {}

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }
  return data;
}

function showMessage(element, text, type = "success") {
  if (!element) return;
  element.textContent = text;
  element.className = `message show ${type}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[char]));
}

function setActiveNav() {
  const file = location.pathname.split("/").pop() || "dashboard.html";
  const map = {
    "dashboard.html": "nav-dashboard",
    "learning-materials.html": "nav-materials",
    "report.html": "nav-report",
    "certifications.html": "nav-certificates",
    "settings.html": "nav-settings"
  };
  const id = map[file];
  if (id) document.getElementById(id)?.classList.add("active");
}

async function loadCurrentUser() {
  const data = await api("/api/auth/me");
  document.querySelectorAll("[data-user-name]").forEach(el => el.textContent = data.user.name);
  document.querySelectorAll("[data-user-email]").forEach(el => el.textContent = data.user.email);

  document.querySelectorAll("[data-avatar]").forEach(el => {
    if (data.user.profile_photo) {
      el.innerHTML = `<img src="${data.user.profile_photo}" alt="Profile" class="avatar">`;
    } else {
      el.textContent = (data.user.name || "U").charAt(0).toUpperCase();
    }
  });
  return data.user;
}

async function protectPage() {
  try {
    const user = await loadCurrentUser();
    setActiveNav();
    return user;
  } catch (err) {
    location.href = "login.html";
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    history.back();
    setTimeout(() => {
      if (location.pathname.endsWith("dashboard.html") ||
          location.pathname.endsWith("settings.html") ||
          location.pathname.endsWith("report.html") ||
          location.pathname.endsWith("learning-materials.html") ||
          location.pathname.endsWith("certifications.html")) {
        location.href = "login.html";
      }
    }, 250);
  });
});
