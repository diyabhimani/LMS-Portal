const express = require("express");
const crypto = require("crypto");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, certificate_number, issued_date, certificate_file
       FROM certificates WHERE user_id = ? ORDER BY issued_date DESC`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load certificates." });
  }
});

router.post("/generate", requireAuth, async (req, res) => {
  try {
    const [userRows] = await db.query(
      `SELECT name, internship_start, internship_end
       FROM users WHERE id = ?`,
      [req.session.user.id]
    );

    const user = userRows[0];
    const today = new Date();

    if (today < new Date(user.internship_end)) {
      return res.status(400).json({ message: "Certificate is available after internship completion." });
    }

    const [reportRows] = await db.query(
      "SELECT COUNT(*) AS total FROM daily_reports WHERE user_id = ? AND submitted = TRUE",
      [req.session.user.id]
    );

    if (reportRows[0].total === 0) {
      return res.status(400).json({ message: "Submit the final report before generating the certificate." });
    }

    const [existing] = await db.query(
      "SELECT * FROM certificates WHERE user_id = ? LIMIT 1",
      [req.session.user.id]
    );

    if (existing.length) {
      return res.json({ message: "Certificate already exists.", certificate: existing[0] });
    }

    const number = "LMS-" + new Date().getFullYear() + "-" + crypto.randomBytes(4).toString("hex").toUpperCase();
    const issued = new Date().toISOString().slice(0, 10);

    const [result] = await db.query(
      `INSERT INTO certificates
       (user_id, certificate_number, issued_date, certificate_file)
       VALUES (?, ?, ?, ?)`,
      [req.session.user.id, number, issued, `${number}.html`]
    );

    res.json({
      message: "Certificate generated successfully.",
      certificate: {
        id: result.insertId,
        certificate_number: number,
        issued_date: issued,
        name: user.name,
        internship_start: user.internship_start,
        internship_end: user.internship_end
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not generate certificate." });
  }
});

module.exports = router;
