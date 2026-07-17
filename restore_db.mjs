import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash << 'EOF'
set -e

echo "=== Find database in Docker volumes ==="
DB_VOL=/var/lib/docker/volumes/kovosrotsoft_db_data/_data
ls -la $DB_VOL/ 2>/dev/null || echo "Volume not found"

echo ""
echo "=== Copy database ==="
if [ -f "$DB_VOL/kovosrot.db" ]; then
  cp "$DB_VOL/kovosrot.db" /opt/kovosrotsoft/data/kovosrot.db
  echo "Database copied! Size: $(du -h /opt/kovosrotsoft/data/kovosrot.db | cut -f1)"
  
  echo ""
  echo "=== Restart app ==="
  pm2 restart kovosrotsoft
  sleep 4
  
  echo ""
  echo "=== Verify DB contents ==="
  node -e "
import sqlite3wasm from 'node-sqlite3-wasm';
const db = new sqlite3wasm.Database('/opt/kovosrotsoft/data/kovosrot.db');
const recs = db.get('SELECT COUNT(*) as c FROM records');
const mats = db.get('SELECT COUNT(*) as c FROM materials');
console.log('Records:', recs.c, '| Materials:', mats.c);
const latest = db.get('SELECT date,material_id FROM records ORDER BY id DESC LIMIT 1');
if (latest) console.log('Latest record:', latest.date);
" /opt/kovosrotsoft/backend/src/
else
  echo "DB not found in Docker volume, checking other locations..."
  find /var/lib/docker -name "*.db" 2>/dev/null | head -5
fi

echo ""
curl -s -o /dev/null -w "App: HTTP %{http_code}\n" http://localhost:3001/
EOF`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
