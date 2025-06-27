const express = require('express');
const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// 🔐 Optional: simple password protection (optional, comment out if unnecessary)
// const ADMIN_PASS = "yourpassword";
// app.use('/view', (req, res, next) => {
//   const { pass } = req.query;
//   if (pass !== ADMIN_PASS) return res.status(403).send("Forbidden");
//   next();
// });

app.post('/submit', (req, res) => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string') {
    return res.status(400).send("无效的电话号码.");
  }

  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = rawIP === '::1' ? '127.0.0.1' : rawIP;

  const geo = geoip.lookup(ip);
  const location = geo
    ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`
    : 'Unknown Location';

  const timestamp = new Date().toISOString();
  const log = `${timestamp} | IP: ${ip} | Location: ${location} | Phone: ${phone}\n`;

  fs.appendFile(path.join(__dirname, 'submissions.txt'), log, (err) => {
    if (err) {
      console.error('❌ Failed to write submission:', err);
      return res.status(500).send("Could not save phone number.");
    }

    console.log('✅ Submission saved:', log.trim());
    res.send("电话号码已保存!");
  });
});

// ✅ /view route to display submissions.txt
app.get('/view', (req, res) => {
  const filePath = path.join(__dirname, 'submissions.txt');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Failed to read submissions:', err);
      return res.status(500).send("无法读取提交记录.");
    }

    // Serve plain text as preformatted HTML
    res.send(`<pre style="white-space: pre-wrap; word-wrap: break-word;">${data || "No submissions yet."}</pre>`);
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
