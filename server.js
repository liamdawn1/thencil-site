const express = require('express');
const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

app.post('/submit', (req, res) => {
  const { phone } = req.body;

  if (!phone || typeof phone !== 'string') {
    return res.status(400).send("无效的电话号码.");
  }

  // Get IP address
  const rawIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ip = rawIP === '::1' ? '127.0.0.1' : rawIP;

  // Lookup geo info
  const geo = geoip.lookup(ip);
  const location = geo
    ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`
    : 'Unknown Location';

  const timestamp = new Date().toISOString();
  const log = `${timestamp} | IP: ${ip} | Location: ${location} | Phone: ${phone}\n`;

  fs.appendFile(path.join(__dirname, 'submissions.txt'), log, (err) => {
    if (err) {
      console.error('Failed to write submission:', err);
      return res.status(500).send("Could not save phone number.");
    }

    res.send("电话号码已保存!");
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
