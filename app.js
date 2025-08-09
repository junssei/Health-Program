const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/request-program', (req, res) => {
  const { programName, requestedBy } = req.body;

  if (!programName || !requestedBy) {
    return res.send(`
      <h2 style="color:red;">Error: Missing input fields.</h2>
      <a href="/">Go back</a>
    `);
  }

  const timestamp = new Date().toLocaleString();

  console.log(`📢 [${timestamp}] Notification: '${programName}' requested by '${requestedBy}'`);

  res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
