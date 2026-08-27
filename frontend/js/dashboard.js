(async function() {
  const user = await protectPage();
  if (!user) return;

  try {
    const [reports, certs] = await Promise.all([
      api("/api/reports"),
      api("/api/certificates")
    ]);

    document.getElementById("reportCount").textContent = reports.length;
    document.getElementById("certCount").textContent = certs.length;

    const start = new Date(user.internship_start + "T00:00:00");
    const end = new Date(user.internship_end + "T23:59:59");
    const now = new Date();

    const total = Math.max(1, end - start);
    const elapsed = Math.min(total, Math.max(0, now - start));
    const percent = Math.round((elapsed / total) * 100);
    const days = Math.max(0, Math.ceil((end - now) / 86400000));

    document.getElementById("progressBar").style.width = `${percent}%`;
    document.getElementById("progressText").textContent = `${percent}%`;
    document.getElementById("daysLeft").textContent = now >= end ? "Done" : days;
    document.getElementById("internshipDates").textContent =
      `${user.internship_start} → ${user.internship_end}`;
  } catch (err) {
    console.error(err);
  }
})();
