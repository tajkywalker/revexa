import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    set -e
    cd /opt/kovosrotsoft
    git pull origin main

    echo "=== Build frontend ==="
    docker run --rm \
      -v /opt/kovosrotsoft/frontend:/app \
      -v kovosrotsoft_frontend_dist:/dist \
      node:20-alpine sh -c "cd /app && npm install --legacy-peer-deps -q && npm run build && cp -r /app/dist/. /dist/ && echo 'Frontend OK'"

    echo "=== Build & restart backend ==="
    docker compose build backend 2>&1 | tail -10
    docker compose up -d --force-recreate backend
    sleep 8

    echo "=== Tests ==="
    curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\n" http://localhost:3001/
    TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}' | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
    curl -s -H "Authorization: Bearer $TOKEN" \
      -o /dev/null -w "API konvertor: HTTP %{http_code}\n" \
      http://localhost:3001/api/konvertor/imports
    echo "=== HOTOVO ==="
  `, (err, stream) => {
    if (err) throw err;
    stream.on('close', c => { conn.end(); process.exit(c ?? 0); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host:'167.233.233.156', port:22, username:'root', password:'bqTAsqrerhLh', readyTimeout:15000 });
