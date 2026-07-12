import { Client } from 'ssh2';
const conn = new Client();

const CMD = `
set -e
cd /opt/kovosrotsoft

echo "=== Git pull ==="
git pull origin main

echo ""
echo "=== Build frontend ==="
docker run --rm \
  -v /opt/kovosrotsoft/frontend:/app \
  -v kovosrotsoft_frontend_dist:/app/dist \
  node:20-alpine sh -c "cd /app && npm install --legacy-peer-deps -q && npm run build && cp -r /app/dist/. /dist/ && echo 'Frontend build OK'"

echo ""
echo "=== Build & restart backend ==="
docker compose build backend
docker compose up -d --force-recreate backend
sleep 5

echo ""
echo "=== Run historical data import ==="
docker compose exec -T backend node /app/src/../scripts/import_history.mjs 2>&1 || \
  docker run --rm \
    -v kovosrotsoft_db_data:/app/data \
    -v /opt/kovosrotsoft/backend:/app \
    node:20-alpine sh -c "cd /app && npm install -q && node scripts/import_history.mjs" 2>&1

echo ""
echo "=== Status ==="
docker compose ps

echo ""
echo "=== Quick API test ==="
sleep 3
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\\n" http://localhost:3001/
curl -s -X POST http://localhost:3001/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin","password":"admin123"}' | grep -o '"token":"[^"]*"' | head -1
echo ""
echo "=== HOTOVO ==="
`;

conn.on('ready', () => {
  console.log('Deploying...\n');
  conn.exec(CMD, (err, stream) => {
    if (err) throw err;
    stream.on('close', c => { conn.end(); console.log('\nDeploy done, exit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
