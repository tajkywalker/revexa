import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash -lc '
    export PATH=/usr/sbin:/usr/local/sbin:$PATH

    echo "=== What is using RAM? ==="
    ps axo pid,pmem,rss,comm --sort=-%mem 2>/dev/null | head -20

    echo ""
    echo "=== Frontend from Docker volume ==="
    DOCKER_VOL=/var/lib/docker/volumes/kovosrotsoft_frontend_dist/_data
    ls $DOCKER_VOL/ 2>/dev/null && echo "Volume found!" || echo "Volume not found"

    echo ""
    echo "=== Copy frontend if exists ==="
    mkdir -p /opt/kovosrotsoft/frontend/dist
    if [ -d "$DOCKER_VOL" ] && [ "$(ls -A $DOCKER_VOL 2>/dev/null)" ]; then
      cp -r $DOCKER_VOL/* /opt/kovosrotsoft/frontend/dist/
      echo "Copied from Docker volume"
      ls /opt/kovosrotsoft/frontend/dist/
    fi

    echo ""
    echo "=== Fix server.js path via Python ==="
    python3 -c "
import re
f = open('/opt/kovosrotsoft/backend/src/server.js')
content = f.read()
f.close()
content = re.sub(r\"const DIST = '.*?';\", \"const DIST = process.env.FRONTEND_DIST || '/opt/kovosrotsoft/frontend/dist';\", content)
f = open('/opt/kovosrotsoft/backend/src/server.js', 'w')
f.write(content)
f.close()
print('Done')
"
    grep "DIST" /opt/kovosrotsoft/backend/src/server.js | head -2

    echo ""
    echo "=== Create data dir ==="
    mkdir -p /opt/kovosrotsoft/data

    echo ""
    echo "=== Create PM2 config ==="
    cat > /opt/kovosrotsoft/pm2.config.cjs << EOF
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
EOF

    echo ""
    echo "=== Start PM2 ==="
    pm2 stop kovosrotsoft 2>/dev/null || true
    pm2 delete kovosrotsoft 2>/dev/null || true
    pm2 start /opt/kovosrotsoft/pm2.config.cjs
    sleep 6

    echo ""
    echo "=== Status ==="
    pm2 ls
    pm2 logs kovosrotsoft --nostream --lines 20

    echo ""
    curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\\n" http://localhost:3001/
    TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '"'"'{"username":"admin","password":"admin123"}'"'"' 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get(\"token\",\"\"))" 2>/dev/null)
    [ -n "$TOKEN" ] && echo "Login: OK (token len=${#TOKEN})" || echo "Login: FAILED"

    echo ""
    echo "=== PM2 save & startup ==="
    pm2 save --force
    pm2 startup 2>&1 | tail -3
  '`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
