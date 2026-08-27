(async function() {
  const user = await protectPage();
  if (!user) return;

  const container = document.getElementById("reportContainer");
  const submitBtn = document.getElementById("submitReportBtn");
  const finalStatus = document.getElementById("finalStatus");
  const durationStatus = document.getElementById("durationStatus");
  const submitInfo = document.getElementById("submitInfo");
  let reports = [];
  let submitted = false;

  const todayISO = () => new Date().toISOString().slice(0,10);

  function toolbar() {
    return `
      <div class="editor-toolbar">
        <button type="button" class="tool-btn" data-cmd="bold"><b>B</b></button>
        <button type="button" class="tool-btn" data-cmd="italic"><i>I</i></button>
        <button type="button" class="tool-btn" data-cmd="underline"><u>U</u></button>
        <button type="button" class="tool-btn" data-cmd="insertUnorderedList">• List</button>
        <button type="button" class="tool-btn" data-cmd="insertOrderedList">1. List</button>
        <button type="button" class="tool-btn" data-cmd="formatBlock" data-value="h2">H</button>
        <button type="button" class="tool-btn" data-cmd="formatBlock" data-value="p">T</button>
        <button type="button" class="tool-btn" data-cmd="fontSize" data-value="5">Large</button>
        <button type="button" class="tool-btn" data-cmd="fontSize" data-value="3">Normal</button>
      </div>
    `;
  }

  function addBox(report = null) {
    const id = report?.id || `new-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const box = document.createElement("div");
    box.className = "card report-box";
    box.dataset.id = id;
    box.dataset.saved = report ? "true" : "false";
    box.innerHTML = `
      <div class="report-box-header">
        <strong>Daily Work</strong>
        <button type="button" class="danger-btn remove-box">Remove</button>
      </div>
      <div class="form-group">
        <label>Date</label>
        <input type="date" class="form-control report-date" value="${report?.report_date ? String(report.report_date).slice(0,10) : todayISO()}">
      </div>
      ${toolbar()}
      <div class="editor" contenteditable="true">${report?.report_content || ""}</div>
      <div class="report-actions" style="margin-top:12px">
        <span class="status-note">${report?.submitted ? "Submitted" : "Not submitted"}</span>
        <button type="button" class="secondary-btn save-report">${report ? "Update" : "Save"} Day</button>
      </div>
    `;
    container.appendChild(box);

    box.querySelectorAll(".tool-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, btn.dataset.value || null);
        box.querySelector(".editor").focus();
      });
    });

    box.querySelector(".remove-box").addEventListener("click", async () => {
      if (box.dataset.saved === "true") {
        const idValue = Number(box.dataset.id);
        if (!confirm("Remove this saved daily report?")) return;
        try {
          await api(`/api/reports/${idValue}`, { method: "DELETE" });
        } catch (err) {
          alert(err.message);
          return;
        }
      }
      box.remove();
      if (!container.children.length) addBox();
    });

    box.querySelector(".save-report").addEventListener("click", async () => {
      const date = box.querySelector(".report-date").value;
      const content = box.querySelector(".editor").innerHTML.trim();

      if (!content || content === "<br>") {
        alert("Write something in the daily report first.");
        return;
      }

      try {
        if (box.dataset.saved === "true") {
          await api(`/api/reports/${box.dataset.id}`, {
            method: "PUT",
            body: JSON.stringify({ report_date: date, report_content: content })
          });
        } else {
          const result = await api("/api/reports", {
            method: "POST",
            body: JSON.stringify({ report_date: date, report_content: content })
          });
          box.dataset.id = result.id;
          box.dataset.saved = "true";
        }
        await loadReports();
      } catch (err) {
        alert(err.message);
      }
    });
  }

  async function loadReports() {
    reports = await api("/api/reports");
    const currentBoxes = [...container.children];
    if (!currentBoxes.length || currentBoxes.every(b => b.dataset.saved === "true")) {
      container.innerHTML = "";
      reports.forEach(r => addBox(r));
      if (!reports.length) addBox();
    }

    const now = new Date();
    const end = new Date(user.internship_end + "T23:59:59");
    const complete = now >= end;
    submitted = reports.some(r => Boolean(r.submitted));

    document.getElementById("startDate").textContent = user.internship_start;
    document.getElementById("endDate").textContent = user.internship_end;
    durationStatus.textContent = complete ? "Completed" : "In Progress";

    if (submitted) {
      submitBtn.disabled = true;
      finalStatus.textContent = "Final report has been submitted.";
      submitInfo.textContent = "Submitted reports are locked from deletion/update.";
    } else if (complete) {
      submitBtn.disabled = false;
      finalStatus.textContent = "Internship completed. You can now submit the final report.";
      submitInfo.textContent = "Your internship duration is complete, so final submission is enabled.";
    } else {
      submitBtn.disabled = true;
      finalStatus.textContent = "Final submission will unlock when the internship end date is reached.";
      submitInfo.textContent = `Submission unlocks after ${user.internship_end}.`;
    }
  }

  submitBtn.addEventListener("click", async () => {
    if (!confirm("Submit the final internship report? You will not be able to edit submitted daily reports.")) return;
    try {
      const result = await api("/api/reports/submit", { method: "POST" });
      alert(result.message);
      await loadReports();
    } catch (err) {
      alert(err.message);
    }
  });

  await loadReports();
})();
