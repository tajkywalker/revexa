import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash << 'ENDBASH'
set -e
export DEBIAN_FRONTEND=noninteractive

echo "=== Install Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null | tail -3
apt-get install -y nodejs 2>&1 | tail -5
node --version
npm --version

echo ""
echo "=== Rebuild frontend with Node 20 ==="
cd /opt/kovosrotsoft/frontend
rm -rf node_modules/.vite dist 2>/dev/null || true
npm install --legacy-peer-deps 2>&1 | tail -3
npm run build 2>&1 | tail -8

echo ""
echo "=== Wait for DB to be ready ==="
sleep 3
ls /opt/kovosrotsoft/data/kovosrot.db && echo "DB exists" || echo "DB missing"

echo ""
echo "=== Run historical import ==="
cd /opt/kovosrotsoft/backend
node scripts/import_history.mjs

echo ""
echo "=== Restart PM2 ==="
pm2 restart kovosrotsoft
sleep 5

echo ""
echo "=== Final status ==="
pm2 ls
curl -s -o /dev/null -w "App: HTTP %{http_code}\n" http://localhost:3001/

TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
RECORDS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/records/summary | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'{sum(r[\"count\"] for r in d)} záznamy, {round(sum(r[\"total_netto\"] for r in d),1)} kg')" 2>/dev/null)
echo "DB: $RECORDS"
ENDBASH`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit:', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH:', e.message); process.exit(1); });
conn.connect({ host: '178.105.220.221', port: 22, username: 'root', password: 'Wqw4trNrKa9q', readyTimeout: 20000 });
