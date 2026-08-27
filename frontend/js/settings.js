(async function() {
  await protectPage();
  const message = document.getElementById("settingsMessage");
  let photoData = "";

  function avatarPlaceholder(name) {
    const canvas = document.createElement("canvas");
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#e5e6ff"; ctx.fillRect(0,0,300,300);
    ctx.fillStyle = "#5b5bd6"; ctx.font = "bold 120px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText((name || "U")[0].toUpperCase(), 150, 150);
    return canvas.toDataURL("image/png");
  }

  async function load() {
    const user = await api("/api/users/profile");
    document.getElementById("name").value = user.name || "";
    document.getElementById("email").value = user.email || "";
    document.getElementById("phone").value = user.phone || "";
    document.getElementById("address").value = user.address || "";
    document.getElementById("internship_start").value = user.internship_start || "";
    document.getElementById("internship_end").value = user.internship_end || "";
    photoData = user.profile_photo || "";
    document.getElementById("profilePhoto").src = photoData || avatarPlaceholder(user.name);

    const activity = await api("/api/users/activity");
    const list = document.getElementById("activityList");
    list.innerHTML = activity.length ? activity.map(row => `
      <div class="activity-row">
        <span class="${row.activity_type === "LOGIN" ? "activity-login" : "activity-logout"}">${escapeHtml(row.activity_type)}</span>
        <span>${new Date(row.activity_time).toLocaleString()}</span>
      </div>
    `).join("") : `<div class="empty">No login activity yet.</div>`;
  }

  document.getElementById("photoInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showMessage(message, "Profile image must be smaller than 2 MB.", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      photoData = reader.result;
      document.getElementById("profilePhoto").src = photoData;
    };
    reader.readAsDataURL(file);
  });

  document.getElementById("profileForm").addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await api("/api/users/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: document.getElementById("name").value.trim(),
          phone: document.getElementById("phone").value.trim(),
          address: document.getElementById("address").value.trim(),
          profile_photo: photoData,
          internship_start: document.getElementById("internship_start").value,
          internship_end: document.getElementById("internship_end").value
        })
      });
      showMessage(message, "Profile saved successfully.");
    } catch (err) {
      showMessage(message, err.message, "error");
    }
  });

  load().catch(err => showMessage(message, err.message, "error"));
})();
