import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash << 'ENDBASH'
echo "=== PM2 status ==="
pm2 ls 2>/dev/null || echo "PM2 not running"

echo ""
echo "=== Memory ==="
free -h | grep Mem

echo ""
echo "=== PM2 logs (last errors) ==="
cat /root/.pm2/logs/kovosrotsoft-error.log 2>/dev/null | tail -20 || echo "No error log"

echo ""
echo "=== Restart app ==="
pm2 restart kovosrotsoft 2>/dev/null || pm2 start /opt/kovosrotsoft/pm2.config.cjs 2>/dev/null || (
  echo "PM2 config not found, recreating..."
  cat > /opt/kovosrotsoft/pm2.config.cjs << 'PMEOF'
module.exports = {
  apps: [{
    name: "kovosrotsoft",
    script: "/opt/kovosrotsoft/backend/src/server.js",
    cwd: "/opt/kovosrotsoft/backend",
    env: {
      PORT: "3001",
      DB_PATH: "/opt/kovosrotsoft/data/kovosrot.db",
      FRONTEND_DIST: "/opt/kovosrotsoft/frontend/dist",
      NODE_ENV: "production"
    },
    autorestart: true,
    watch: false
  }]
};
PMEOF
  pm2 start /opt/kovosrotsoft/pm2.config.cjs
)

sleep 5

echo ""
echo "=== Status after restart ==="
pm2 ls

echo ""
echo "=== Check port ==="
ss -tlnp | grep 3001 || echo "Port 3001 not listening!"

echo ""
echo "=== HTTP test ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3001/

echo ""
pm2 save --force
ENDBASH`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nDone, exit:', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH:', e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 20000 });
