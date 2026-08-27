(async function() {
  await protectPage();

  const area = document.getElementById("certificateArea");
  const badge = document.getElementById("certBadge");
  const message = document.getElementById("certMessage");

  function certificateHtml(cert) {
    return `
      <div class="certificate" id="certificate">
        <div class="small muted">LEARNING MANAGEMENT SYSTEM</div>
        <h2>Certificate of Internship</h2>
        <div class="line"></div>
        <div>This certificate is proudly presented to</div>
        <div class="cert-name">${escapeHtml(cert.name)}</div>
        <div>for successfully completing the internship program</div>
        <p><strong>${escapeHtml(cert.internship_start)}</strong> to <strong>${escapeHtml(cert.internship_end)}</strong></p>
        <p>and submitting the required internship report.</p>
        <div class="line"></div>
        <div class="small muted">Certificate No: ${escapeHtml(cert.certificate_number)} &nbsp; | &nbsp; Issued: ${escapeHtml(cert.issued_date)}</div>
      </div>
      <div class="cert-actions">
        <button id="downloadCertificate" class="primary-btn">Download Certificate</button>
        <button id="printCertificate" class="secondary-btn">Print</button>
      </div>
    `;
  }

  function bindCertificate(cert) {
    document.getElementById("downloadCertificate").addEventListener("click", () => {
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Certificate</title>
      <style>body{font-family:Arial,sans-serif;padding:50px}.certificate{min-height:460px;padding:42px;border:8px double #5b5bd6;text-align:center;background:#f8f9ff}.cert-name{font-size:38px;font-weight:900;margin:25px}.line{height:2px;background:#5b5bd6;width:75%;margin:20px auto}</style></head><body>${document.getElementById("certificate").outerHTML}</body></html>`;
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${cert.certificate_number}.html`; a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("printCertificate").addEventListener("click", () => {
      const win = window.open("", "_blank");
      win.document.write(`<html><head><title>Certificate</title><style>body{font-family:Arial;padding:40px}.certificate{min-height:460px;padding:42px;border:8px double #5b5bd6;text-align:center}.cert-name{font-size:38px;font-weight:900;margin:25px}.line{height:2px;background:#5b5bd6;width:75%;margin:20px auto}</style></head><body>${document.getElementById("certificate").outerHTML}</body></html>`);
      win.document.close();
      win.print();
    });
  }

  try {
    const [userData, certs, reports] = await Promise.all([
      api("/api/users/profile"),
      api("/api/certificates"),
      api("/api/reports")
    ]);

    const user = userData;
    const complete = new Date() >= new Date(user.internship_end + "T23:59:59");
    const submitted = reports.some(r => Boolean(r.submitted));

    if (certs.length) {
      const cert = { ...certs[0], name: user.name, internship_start: user.internship_start, internship_end: user.internship_end };
      badge.textContent = "Issued";
      area.className = "";
      area.innerHTML = certificateHtml(cert);
      bindCertificate(cert);
      return;
    }

    if (complete && submitted) {
      badge.textContent = "Eligible";
      area.className = "";
      area.innerHTML = `
        <div style="padding:35px;text-align:center">
          <h3>Congratulations, ${escapeHtml(user.name)}!</h3>
          <p class="muted">Your internship is completed and your final report is submitted.</p>
          <button id="generateCertificate" class="primary-btn">Generate Certificate</button>
        </div>`;
      document.getElementById("generateCertificate").addEventListener("click", async () => {
        try {
          const result = await api("/api/certificates/generate", { method: "POST" });
          const cert = { ...result.certificate, name:user.name, internship_start:user.internship_start, internship_end:user.internship_end };
          area.innerHTML = certificateHtml(cert);
          badge.textContent = "Issued";
          bindCertificate(cert);
        } catch (err) {
          showMessage(message, err.message, "error");
        }
      });
    } else {
      badge.textContent = "Locked";
      area.className = "empty";
      area.innerHTML = `
        <h3>Certificate not available yet</h3>
        <p>Complete your internship duration and submit the final report.</p>
        <p class="small muted">Internship end: ${escapeHtml(user.internship_end)} | Report submitted: ${submitted ? "Yes" : "No"}</p>`;
    }
  } catch (err) {
    showMessage(message, err.message, "error");
  }
})();
