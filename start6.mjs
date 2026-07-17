import { Client } from 'ssh2';
const conn = new Client();

const SCRIPT = `
set -e
export PATH=/usr/sbin:/usr/local/sbin:/usr/bin:/bin:$PATH

echo "=== What is using RAM? ==="
ps axo pid,pmem,rss,comm --sort=-%mem 2>/dev/null | head -15

echo ""
echo "=== Frontend from Docker volume ==="
DOCKER_VOL=/var/lib/docker/volumes/kovosrotsoft_frontend_dist/_data
mkdir -p /opt/kovosrotsoft/frontend/dist
if [ -d "$DOCKER_VOL" ] && [ "$(ls -A $DOCKER_VOL 2>/dev/null)" ]; then
  cp -r ${DOCKER_VOL}/. /opt/kovosrotsoft/frontend/dist/
  echo "Copied from Docker volume"
  ls /opt/kovosrotsoft/frontend/dist/
else
  echo "Volume not found - dist might be missing"
fi

echo ""
echo "=== Fix server.js path ==="
python3 << 'PYEOF'
import re
with open('/opt/kovosrotsoft/backend/src/server.js') as f:
    content = f.read()
content = re.sub(
    r"const DIST = '[^']*';",
    "const DIST = process.env.FRONTEND_DIST || '/opt/kovosrotsoft/frontend/dist';",
    content
)
with open('/opt/kovosrotsoft/backend/src/server.js', 'w') as f:
    f.write(content)
print('server.js updated')
PYEOF
grep "DIST =" /opt/kovosrotsoft/backend/src/server.js | head -2

echo ""
echo "=== Create data dir ==="
mkdir -p /opt/kovosrotsoft/data

echo ""
echo "=== PM2 config ==="
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

echo ""
echo "=== Start with PM2 ==="
pm2 stop kovosrotsoft 2>/dev/null || true
pm2 delete kovosrotsoft 2>/dev/null || true
pm2 start /opt/kovosrotsoft/pm2.config.cjs
sleep 6

echo ""
pm2 ls
pm2 logs kovosrotsoft --nostream --lines 15

echo ""
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\\n" http://localhost:3001/

echo ""
pm2 save --force
pm2 startup 2>&1 | grep -E "systemctl|error|command" | head -5
`;

conn.on('ready', () => {
  conn.exec(`bash -c ${JSON.stringify(SCRIPT)}`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
