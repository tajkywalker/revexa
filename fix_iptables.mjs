import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    set -e
    echo "=== Installing iptables ===" && \
    apt-get update -qq && \
    apt-get install -y -qq iptables && \
    iptables --version && \
    echo "" && echo "=== Resetting Docker service ===" && \
    systemctl reset-failed docker 2>/dev/null || true && \
    systemctl start docker && \
    sleep 5 && \
    systemctl status docker --no-pager | head -8 && \
    echo "" && echo "=== Starting app ===" && \
    cd /opt/kovosrotsoft && \
    docker compose up -d && \
    sleep 8 && \
    docker compose ps && \
    echo "" && curl -s -o /dev/null -w "HTTP %{http_code} - app je LIVE\\n" http://localhost:3001/
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nDone', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
