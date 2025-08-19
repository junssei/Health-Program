const fs = require('fs');
const path = require('path');

module.exports = function logger(req, res, next) {
  const line = `[${new Date().toISOString()}] ${req.method} ${req.url}`;
  console.log(line);

  // append to access log
  const LOG_DIR = path.join(__dirname, '..', 'logs');
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOG_DIR, 'access.log'), line + '\n');
  } catch (e) {
    console.error('Failed to write access log:', e.message);
  }

  next();
};
