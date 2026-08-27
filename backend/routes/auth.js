const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone = "", address = "", internship_start, internship_end } = req.body;

    if (!name || !email || !password || !internship_start || !internship_end) {
      return res.status(400).json({ message: "Name, email, password and internship dates are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must contain at least 6 characters." });
    }

    if (new Date(internship_end) < new Date(internship_start)) {
      return res.status(400).json({ message: "Internship end date cannot be before start date." });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing.length) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
      (name, email, password, phone, address, internship_start, internship_end)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email.toLowerCase(), hash, phone, address, internship_start, internship_end]
    );

    req.session.user = { id: result.insertId, name, email: email.toLowerCase() };

    await db.query(
      "INSERT INTO login_activity (user_id, activity_type) VALUES (?, 'LOGIN')",
      [result.insertId]
    );

    res.json({ message: "Account created successfully.", user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while creating account." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!rows.length) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = { id: user.id, name: user.name, email: user.email };

    await db.query(
      "INSERT INTO login_activity (user_id, activity_type) VALUES (?, 'LOGIN')",
      [user.id]
    );

    res.json({ message: "Login successful.", user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while logging in." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    if (req.session.user) {
      await db.query(
        "INSERT INTO login_activity (user_id, activity_type) VALUES (?, 'LOGOUT')",
        [req.session.user.id]
      );
    }

    req.session.destroy(err => {
      if (err) return res.status(500).json({ message: "Could not logout." });
      res.json({ message: "Logged out successfully." });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error while logging out." });
  }
});

router.get("/me", async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in." });

    const [rows] = await db.query(
      `SELECT id, name, email, phone, address, profile_photo,
              internship_start, internship_end, created_at
       FROM users WHERE id = ?`,
      [req.session.user.id]
    );

    if (!rows.length) return res.status(401).json({ message: "User not found." });

    res.json({ user: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
