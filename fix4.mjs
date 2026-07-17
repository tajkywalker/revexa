import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    set -e
    
    echo "=== Fix tzdata lock ===" && \
    dpkg --remove --force-remove-reinstreq tzdata 2>/dev/null || true && \
    rm -f /var/lib/dpkg/info/tzdata.* 2>/dev/null || true && \
    dpkg --configure -a 2>/dev/null || true && \
    
    echo "=== Install iptables directly ===" && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends iptables && \
    echo "iptables: $(iptables --version)" && \

    echo "=== Restart Docker ===" && \
    systemctl reset-failed docker 2>/dev/null || true && \
    systemctl restart docker && sleep 5 && \
    docker info --format "Server: {{.ServerVersion}}" && \
    
    echo "=== Start containers ===" && \
    cd /opt/kovosrotsoft && \
    docker compose up -d && sleep 8 && \
    docker compose ps && \
    curl -s -o /dev/null -w "App: HTTP %{http_code}\\n" http://localhost:3001/
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
