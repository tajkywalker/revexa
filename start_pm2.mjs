import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash -lc '
    export PATH=/usr/sbin:/usr/local/sbin:/usr/bin/node:$PATH
    set -e

    echo "=== Stop Docker to free RAM ==="
    systemctl stop docker docker.socket 2>/dev/null || true
    sleep 2
    free -h | grep Mem

    echo ""
    echo "=== Install backend deps ==="
    cd /opt/kovosrotsoft/backend
    npm install --production --ignore-scripts 2>&1 | tail -3

    echo ""
    echo "=== Build frontend ==="
    cd /opt/kovosrotsoft/frontend
    npm install 2>&1 | tail -3
    npm run build 2>&1 | tail -5

    echo ""
    echo "=== Update server.js to use correct frontend path ==="
    sed -i "s|const DIST = .*/app/frontend/dist.*|const DIST = process.env.FRONTEND_DIST || \\"/opt/kovosrotsoft/frontend/dist\\";|" /opt/kovosrotsoft/backend/src/server.js
    grep "DIST" /opt/kovosrotsoft/backend/src/server.js | head -3

    echo ""
    echo "=== Create PM2 ecosystem file ==="
    cat > /opt/kovosrotsoft/ecosystem.config.cjs << '\''EOF'\''
module.exports = {
  apps: [{
    name: "kovosrotsoft",
    script: "/opt/kovosrotsoft/backend/src/server.js",
    cwd: "/opt/kovosrotsoft/backend",
    env: {
      PORT: 3001,
      DB_PATH: "/opt/kovosrotsoft/data/kovosrot.db",
      FRONTEND_DIST: "/opt/kovosrotsoft/frontend/dist",
      NODE_ENV: "production"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "300M"
  }]
};
EOF

    mkdir -p /opt/kovosrotsoft/data

    echo ""
    echo "=== Start with PM2 ==="
    pm2 stop kovosrotsoft 2>/dev/null || true
    pm2 delete kovosrotsoft 2>/dev/null || true
    pm2 start /opt/kovosrotsoft/ecosystem.config.cjs
    pm2 save

    sleep 5
    echo ""
    echo "=== Status ==="
    pm2 status

    echo ""
    curl -s -o /dev/null -w "App: HTTP %{http_code}\\n" http://localhost:3001/
    
    echo ""
    echo "=== Enable PM2 on boot ==="
    pm2 startup systemd -u root --hp /root 2>&1 | tail -5
    systemctl enable pm2-root 2>/dev/null || true
  '`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
