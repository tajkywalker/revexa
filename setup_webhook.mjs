import { Client } from 'ssh2';
const conn = new Client();

// Install a tiny deploy webhook on the server
// POST /deploy → git pull + docker compose up
const CMD = `
set -e

# Create a simple deploy webhook using node
mkdir -p /opt/webhook
cat > /opt/webhook/webhook.mjs << 'WEBHOOK_EOF'
import http from 'http';
import { execSync } from 'child_process';
import crypto from 'crypto';

const PORT = 9000;

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/deploy') {
    console.log('[webhook] Deploy triggered at', new Date().toISOString());
    try {
      const out = execSync(
        'cd /opt/kovosrotsoft && git pull origin main && docker compose build backend && docker compose up -d --force-recreate backend',
        { stdio: 'pipe', timeout: 120000 }
      ).toString();
      console.log(out);
      res.writeHead(200);
      res.end('Deploy OK\\n');
    } catch (e) {
      console.error(e.message);
      res.writeHead(500);
      res.end('Deploy failed: ' + e.message);
    }
  } else {
    res.writeHead(200);
    res.end('KovosrotSoft webhook ready\\n');
  }
});

server.listen(PORT, () => console.log('Webhook listening on port', PORT));
WEBHOOK_EOF

# Create systemd service for webhook
cat > /etc/systemd/system/kovosrot-webhook.service << 'SVC_EOF'
[Unit]
Description=KovosrotSoft Deploy Webhook
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/webhook
ExecStart=/usr/bin/node /opt/webhook/webhook.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SVC_EOF

systemctl daemon-reload
systemctl enable kovosrot-webhook
systemctl restart kovosrot-webhook
sleep 2
systemctl status kovosrot-webhook --no-pager | head -10

echo ""
echo "Webhook running on port 9000"
echo "Deploy trigger: curl -X POST http://167.233.233.156:9000/deploy"
`;

conn.on('ready', () => {
  conn.exec(CMD, (err, stream) => {
    if (err) throw err;
    stream.on('close', c => { conn.end(); console.log('\nDone:', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
