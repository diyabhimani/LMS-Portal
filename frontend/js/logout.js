(async function() {
  try { await api("/api/auth/logout", { method: "POST" }); } catch (_) {}
  history.back();
  setTimeout(() => location.href = "login.html", 300);
})();
document.getElementById("manualBack").addEventListener("click", () => history.back());
