import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Memory ===" && free -h && df -h / | tail -1 && \

    echo "" && echo "=== Fix broken dpkg (tzdata) ===" && \
    rm -f /var/lib/dpkg/info/tzdata.postinst 2>/dev/null && \
    dpkg --configure tzdata 2>/dev/null || true && \
    
    echo "" && echo "=== Force reinstall iptables ===" && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --reinstall iptables 2>&1 | tail -8 && \
    
    echo "" && echo "=== Find iptables binary ===" && \
    dpkg -L iptables | grep bin && \
    ls -la $(dpkg -L iptables | grep "bin/iptables$" | head -1) 2>/dev/null || echo "binary not found via dpkg" && \
    
    echo "" && echo "=== Restart Docker ===" && \
    systemctl reset-failed docker 2>/dev/null; systemctl restart docker && sleep 5 && \
    docker --version && \
    
    echo "=== Start app ===" && \
    cd /opt/kovosrotsoft && docker compose up -d && sleep 8 && \
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
