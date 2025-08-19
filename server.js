const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const qrcode = require('qrcode');

const http = require('http');
const https = require('https');
const { Server: WebSocketServer } = require('ws');
const CERT_PATH = path.join(__dirname, 'cert.pem');
const KEY_PATH = path.join(__dirname, 'key.pem');

const app = express();
const PORT = process.env.PORT || 3000;
const MODE = process.env.MODE || 'wasm'; // placeholder switch for README/CLI parity

// Optional: Enable CORS if needed for cross-origin requests
// const cors = require('cors');
// app.use(cors());

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// receive metrics from the browser and write metrics.json
app.post('/metrics', async (req, res) => {
  try {
    const metrics = req.body || {};
    await fs.writeFile(path.join(__dirname, 'metrics.json'), JSON.stringify(metrics, null, 2));
    return res.json({ ok: true });
  } catch (e) {
    console.error('Failed to write metrics.json', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// simple health route
app.get('/health', (_req, res) => res.json({ ok: true, mode: MODE }));

// util: discover a likely LAN IP for QR
function getLocalIp() {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    const iface = ifaces[name];
    if (!Array.isArray(iface)) continue;
    for (const info of iface) {
      if (info && info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return 'localhost';
}

// HTTPS or HTTP server
let server;
let isHttps = false;
let serverOptions = {};
try {
  const cert = require('fs').readFileSync(CERT_PATH);
  const key = require('fs').readFileSync(KEY_PATH);
  serverOptions = { cert, key };
  server = https.createServer(serverOptions, app);
  isHttps = true;
  console.log('Using HTTPS (cert.pem, key.pem found)');
} catch (e) {
  server = http.createServer(app);
  console.log('Using HTTP (no cert.pem/key.pem found)');
}
const wss = new WebSocketServer({ server });

// Placeholder: server-side detection (to be implemented)
async function detectObjectsOnServer(imageBuffer) {
  // TODO: Use tfjs-node or Python backend for real detection
  // For now, return a fake detection
  return [
    {
      bbox: [50, 50, 100, 100],
      class: 'person',
      score: 0.9,
    },
  ];
}

wss.on('connection', (ws) => {
  ws.on('message', async (data) => {
    // Expect: { image: <base64 or binary> }
    let msg;
    try {
      msg = JSON.parse(data);
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }
    if (!msg.image) {
      ws.send(JSON.stringify({ error: 'No image provided' }));
      return;
    }
    // Decode base64 image
    const imageBuffer = Buffer.from(msg.image, 'base64');
    // Run detection (placeholder)
    const detections = await detectObjectsOnServer(imageBuffer);
    ws.send(JSON.stringify({ detections }));
  });
});

// catch-all 404 handler (optional, for better UX)
app.use((req, res, next) => {
  if (req.accepts('html')) {
    return res.status(404).send('<h1>404 Not Found</h1>');
  }
  if (req.accepts('json')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.status(404).type('txt').send('Not found');
});

server.listen(PORT, () => {
  (async () => {
    const ip = getLocalIp();
    const protocol = isHttps ? 'https' : 'http';
    const url = `${protocol}://${ip}:${PORT}`;
    console.log(`\n🚀 server running: ${url}  (MODE=${MODE})\n`);
    console.log('📱 scan this QR on your phone to join:\n');
    try {
      console.log(await qrcode.toString(url, { type: 'terminal', small: true }));
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
    console.log('\n(if phone cannot open the LAN URL, ensure same Wi-Fi or share hotspot)\n');
  })();
});
