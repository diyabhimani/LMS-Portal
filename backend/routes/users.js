const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/profile", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, phone, address, profile_photo,
              internship_start, internship_end, created_at
       FROM users WHERE id = ?`,
      [req.session.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load profile." });
  }
});

router.put("/profile", requireAuth, async (req, res) => {
  try {
    const { name, phone, address, profile_photo, internship_start, internship_end } = req.body;

    await db.query(
      `UPDATE users
       SET name = ?, phone = ?, address = ?, profile_photo = ?,
           internship_start = ?, internship_end = ?
       WHERE id = ?`,
      [name || "", phone || "", address || "", profile_photo || "",
       internship_start || null, internship_end || null, req.session.user.id]
    );

    res.json({ message: "Profile updated successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update profile." });
  }
});

router.get("/activity", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, activity_type, activity_time
       FROM login_activity
       WHERE user_id = ?
       ORDER BY activity_time DESC
       LIMIT 20`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load activity." });
  }
});

module.exports = router;
