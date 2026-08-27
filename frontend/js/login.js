document.getElementById("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const message = document.getElementById("loginMessage");

  try {
    await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
      })
    });
    showMessage(message, "Login successful. Opening dashboard...");
    setTimeout(() => location.href = "dashboard.html", 400);
  } catch (err) {
    showMessage(message, err.message, "error");
  }
});
