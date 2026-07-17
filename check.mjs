import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Docker containers ===" && docker ps -a --format "{{.Names}} | {{.Status}} | {{.Ports}}" && \
    echo "" && echo "=== Logs backend (last 30 lines) ===" && \
    cd /opt/kovosrotsoft && docker compose logs backend --tail=30 2>&1
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end());
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH error:', e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
