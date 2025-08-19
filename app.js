const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = 3000;

// middlewares
const logger = require('./middlewares/logger');
const validateRequest = require('./middlewares/validator');
const notifier = require('./middlewares/notifier');

// ensure logs directory exists
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

app.use(express.urlencoded({ extended: true }));
app.use(logger);
app.use(express.static('public'));

// handle program requests (validation + notifier will run)
app.post('/request-program', validateRequest, notifier, (req, res) => {
  const { programName, requestedBy } = req.body;
  const timestamp = new Date().toLocaleString();
  const id = `${Date.now()}-${Math.random().toString(16).slice(2,8)}`;
  const entry = {
    id,
    programName,
    programDescription: req.body.programDescription || '',
    requestedBy,
    timestamp
  };

  // Append request as a JSON-line to requests log
  fs.appendFileSync(path.join(LOG_DIR, 'requests.log'), JSON.stringify(entry) + '\n');

  // redirect to success page with id so user can track
  res.redirect(`/success.html?id=${encodeURIComponent(id)}`);
});

// Admin API: fetch saved requests (latest first)
app.get('/api/requests', (req, res) => {
  const file = path.join(LOG_DIR, 'requests.log');
  const approvalsFile = path.join(LOG_DIR, 'approvals.log');
  if (!fs.existsSync(file)) return res.json([]);

  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
  const objs = lines.map(l => {
    try { return JSON.parse(l); } catch (e) { return { raw: l }; }
  });

  // read approvals and map by id
  const approvals = {};
  if (fs.existsSync(approvalsFile)) {
    const alines = fs.readFileSync(approvalsFile, 'utf8').trim().split('\n').filter(Boolean);
    alines.forEach(l => {
      try { const a = JSON.parse(l); approvals[a.id] = a; } catch (e) { }
    });
  }

  // annotate requests with approval info and return latest-first
  const annotated = objs.map(o => {
    const a = approvals[o.id];
    if (a) return Object.assign({}, o, { approved: true, approvedBy: a.approvedBy, approvedAt: a.timestamp });
    return Object.assign({}, o, { approved: false });
  }).reverse();

  res.json(annotated);
});

// get single request by id (with approval status)
app.get('/api/requests/:id', (req, res) => {
  const id = req.params.id;
  const file = path.join(LOG_DIR, 'requests.log');
  const approvalsFile = path.join(LOG_DIR, 'approvals.log');
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'not found' });

  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean);
  let found = null;
  for (const l of lines) {
    try { const o = JSON.parse(l); if (o.id === id) { found = o; break; } } catch (e) { }
  }
  if (!found) return res.status(404).json({ error: 'not found' });

  // check approvals
  if (fs.existsSync(approvalsFile)) {
    const alines = fs.readFileSync(approvalsFile, 'utf8').trim().split('\n').filter(Boolean);
    for (const l of alines) {
      try { const a = JSON.parse(l); if (a.id === id) { found.approved = true; found.approvedBy = a.approvedBy; found.approvedAt = a.timestamp; break; } } catch (e) { }
    }
  }

  if (!found.approved) found.approved = false;
  res.json(found);
});

// approve a request (admin action)
app.post('/api/requests/:id/approve', express.json(), (req, res) => {
  const id = req.params.id;
  const approver = (req.body && req.body.approvedBy) || 'admin';
  const timestamp = new Date().toLocaleString();
  // append to approvals log
  const approval = { id, approvedBy: approver, timestamp };
  try {
    fs.appendFileSync(path.join(LOG_DIR, 'approvals.log'), JSON.stringify(approval) + '\n');
    // write notification entry
    const note = `✅ [${timestamp}] Request ${id} approved by ${approver}`;
    fs.appendFileSync(path.join(LOG_DIR, 'notifications.log'), note + '\n');
    return res.json({ ok: true, approval });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// Admin API: fetch different logs (access/notifications)
app.get('/api/logs', (req, res) => {
  const type = req.query.type || 'access';
  const allowed = { access: 'access.log', notifications: 'notifications.log', requests: 'requests.log' };
  const filename = allowed[type];
  if (!filename) return res.status(400).json({ error: 'invalid log type' });

  const file = path.join(LOG_DIR, filename);
  if (!fs.existsSync(file)) return res.json([]);

  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').filter(Boolean).reverse();
  res.json(lines);
});

// Clear / reset logs
app.post('/api/logs/clear', (req, res) => {
  const type = req.query.type || 'all';
  const allowed = { access: 'access.log', notifications: 'notifications.log', requests: 'requests.log' };

  try {
    if (type === 'all') {
      Object.values(allowed).forEach(fname => {
        const p = path.join(LOG_DIR, fname);
        if (fs.existsSync(p)) fs.writeFileSync(p, '');
      });
      return res.json({ ok: true, cleared: 'all' });
    }

    const filename = allowed[type];
    if (!filename) return res.status(400).json({ error: 'invalid log type' });

    const file = path.join(LOG_DIR, filename);
    if (fs.existsSync(file)) fs.writeFileSync(file, '');
    return res.json({ ok: true, cleared: type });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
