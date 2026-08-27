document.getElementById("signupForm").addEventListener("submit", async e => {
  e.preventDefault();
  const message = document.getElementById("signupMessage");

  try {
    await api("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({
        name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value,
        phone: document.getElementById("phone").value.trim(),
        address: document.getElementById("address").value.trim(),
        internship_start: document.getElementById("internship_start").value,
        internship_end: document.getElementById("internship_end").value
      })
    });
    showMessage(message, "Account created. Opening dashboard...");
    setTimeout(() => location.href = "dashboard.html", 400);
  } catch (err) {
    showMessage(message, err.message, "error");
  }
});
