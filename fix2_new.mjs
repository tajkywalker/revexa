import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash << 'ENDBASH'
set -e

echo "=== Restart backend (Node 20) so DB gets seeded ==="
pm2 restart kovosrotsoft
sleep 8

echo "=== Check DB tables ==="
node -e "
import sqlite3wasm from 'node-sqlite3-wasm';
const db = new sqlite3wasm.Database('/opt/kovosrotsoft/data/kovosrot.db');
const tables = db.all(\"SELECT name FROM sqlite_master WHERE type='table'\");
console.log('Tables:', tables.map(t=>t.name).join(', '));
const mats = db.all('SELECT * FROM materials');
console.log('Materials:', mats.length, mats.map(m=>m.abbreviation).join(', '));
" /opt/kovosrotsoft/backend/src/ 2>&1

echo ""
echo "=== Run import ==="
cd /opt/kovosrotsoft/backend
node scripts/import_history.mjs

echo ""
echo "=== Final test ==="
curl -s -o /dev/null -w "App: HTTP %{http_code}\n" http://localhost:3001/

TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import json,sys; print(json.load(sys.stdin).get('token',''))")
echo "Token: ${TOKEN:0:15}..."

curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/records/summary | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('Záznamy:', sum(r['count'] for r in d))
print('Čistá:  ', round(sum(r['total_netto'] for r in d),1), 'kg')
for r in sorted(d, key=lambda x:-x['total_netto'])[:5]:
    print(f'  {r[\"material_abbr\"]:6} {r[\"type_name\"]:30} {r[\"count\"]:3}x {r[\"total_netto\"]:8.1f}kg')
"
ENDBASH`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit:', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH:', e.message); process.exit(1); });
conn.connect({ host: '178.105.220.221', port: 22, username: 'root', password: 'Wqw4trNrKa9q', readyTimeout: 20000 });
