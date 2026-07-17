import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Starting Docker ===" && \
    systemctl start docker && \
    sleep 3 && \
    systemctl status docker --no-pager | head -5 && \
    echo "" && echo "=== Starting app ===" && \
    cd /opt/kovosrotsoft && \
    docker compose up -d && \
    sleep 6 && \
    docker compose ps && \
    echo "" && echo "=== HTTP test ===" && \
    curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\\n" http://localhost:3001/ && \
    echo "" && echo "=== Enabling Docker autostart ===" && \
    systemctl enable docker && \
    echo "Docker autostart enabled"
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nDone, exit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH error:', e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
