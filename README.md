# LMS Portal - HTML/CSS/JavaScript + Node.js + MySQL

## 1. Requirements
Install:
- Node.js
- MySQL (XAMPP is fine)
- A browser

## 2. Create the database
1. Start MySQL in XAMPP.
2. Open phpMyAdmin.
3. Open the `database/lms_portal.sql` file.
4. Copy/paste it into the SQL tab and run it.

## 3. Configure MySQL
The default configuration is:
- Host: localhost
- User: root
- Password: empty
- Database: lms_portal

If your MySQL password is not empty, edit `backend/db.js` or set environment variables:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME

## 4. Install backend packages
Open Terminal in the `backend` folder:

```bash
npm install
```

## 5. Start the website
Still inside `backend`:

```bash
node server.js
```

Then open:

http://localhost:3000

Do NOT open the HTML files directly with `file://`. The Node.js server must be running.

## 6. Test
1. Click Sign in.
2. Create an account and enter internship start/end dates.
3. Login.
4. Check Dashboard.
5. Open Settings and change profile details/photo.
6. Add daily reports.
7. When the internship end date has passed, submit the final report.
8. Open Certifications and generate the certificate.
9. Login/logout events are stored in `login_activity`.

## Notes
- Passwords are hashed with bcrypt.
- MySQL stores user/profile/report/certificate/login activity data.
- Profile photo is stored as a data URL in MySQL for this demo.
- Logout records the event and uses `history.back()` rather than an anchor link.
- The report editor uses the browser's contenteditable/execCommand editing commands for bold, lists, headings and font sizes.
