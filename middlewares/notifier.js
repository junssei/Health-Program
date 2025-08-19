const fs = require('fs');
const path = require('path');

module.exports = function notifier(req, res, next) {
  const { requestedBy, programName } = req.body;
  const timestamp = new Date().toLocaleString();
  const desc = req.body.programDescription ? ` — ${req.body.programDescription}` : '';
  const message = `📢 [${timestamp}] Notification: Health Program '${programName}' requested by '${requestedBy}'${desc}`;

  // write to notifications log
  const LOG_DIR = path.join(__dirname, '..', 'logs');
  try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(path.join(LOG_DIR, 'notifications.log'), message + '\n');
  } catch (e) {
    // don't block request on logging failure
    console.error('Failed to write notification log:', e.message);
  }

  // Mock sending an email / external notification (extendable)
  try {
    // In production, hook an email/sms service here. For now just console log.
    console.log(message + ' (sent)');
  } catch (e) {
    console.error('Notification send failed:', e.message);
  }

  // expose the message on req for potential downstream use
  req.notificationMessage = message;

  next();
};