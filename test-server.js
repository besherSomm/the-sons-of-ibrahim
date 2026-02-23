const express = require('express');
const app = express();

// Test if Express is working
app.get('/test', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Test server listening on http://localhost:${PORT}`);
});
