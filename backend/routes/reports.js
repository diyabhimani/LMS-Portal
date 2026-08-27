const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, report_date, report_content, submitted, created_at
       FROM daily_reports WHERE user_id = ?
       ORDER BY report_date ASC`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load reports." });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const { report_date, report_content } = req.body;

    if (!report_date || !report_content || !report_content.trim()) {
      return res.status(400).json({ message: "Date and report content are required." });
    }

    const [userRows] = await db.query(
      "SELECT internship_start, internship_end FROM users WHERE id = ?",
      [req.session.user.id]
    );

    const user = userRows[0];
    const reportDate = new Date(report_date);
    const start = new Date(user.internship_start);
    const end = new Date(user.internship_end);

    if (reportDate < start || reportDate > end) {
      return res.status(400).json({ message: "Report date must be within the internship duration." });
    }

    const [result] = await db.query(
      `INSERT INTO daily_reports (user_id, report_date, report_content)
       VALUES (?, ?, ?)`,
      [req.session.user.id, report_date, report_content]
    );

    res.json({ message: "Daily report saved.", id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save report." });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { report_date, report_content } = req.body;

    const [result] = await db.query(
      `UPDATE daily_reports
       SET report_date = ?, report_content = ?
       WHERE id = ? AND user_id = ? AND submitted = FALSE`,
      [report_date, report_content, req.params.id, req.session.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Report not found or already submitted." });
    }

    res.json({ message: "Report updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update report." });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM daily_reports WHERE id = ? AND user_id = ? AND submitted = FALSE",
      [req.params.id, req.session.user.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Report not found or already submitted." });
    }

    res.json({ message: "Report deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete report." });
  }
});

router.post("/submit", requireAuth, async (req, res) => {
  try {
    const [userRows] = await db.query(
      "SELECT internship_start, internship_end FROM users WHERE id = ?",
      [req.session.user.id]
    );

    const user = userRows[0];
    const today = new Date();
    const end = new Date(user.internship_end);

    if (today < end) {
      return res.status(400).json({
        message: `Your internship is not completed. Submission is available after ${user.internship_end}.`
      });
    }

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM daily_reports
       WHERE user_id = ? AND report_content IS NOT NULL AND TRIM(report_content) <> ''`,
      [req.session.user.id]
    );

    if (countRows[0].total === 0) {
      return res.status(400).json({ message: "Add at least one daily report before submitting." });
    }

    await db.query(
      "UPDATE daily_reports SET submitted = TRUE WHERE user_id = ?",
      [req.session.user.id]
    );

    res.json({ message: "Final report submitted successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not submit final report." });
  }
});

module.exports = router;
