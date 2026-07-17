import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Find iptables ===" && \
    find / -name "iptables" -type f 2>/dev/null | head -10 && \
    echo "" && echo "=== PATH ===" && echo $PATH && \
    echo "" && echo "=== /sbin/iptables ===" && ls -la /sbin/iptables /usr/sbin/iptables /usr/bin/iptables 2>&1 && \
    echo "" && echo "=== Alternatives ===" && update-alternatives --list iptables 2>&1 && \
    echo "" && echo "=== Fix PATH and try Docker ===" && \
    export PATH=/sbin:/usr/sbin:$PATH && \
    iptables --version && \
    
    echo "=== Create symlink if needed ===" && \
    ln -sf /sbin/iptables /usr/local/bin/iptables 2>/dev/null || true && \
    ln -sf /sbin/iptables-legacy /usr/local/bin/iptables-legacy 2>/dev/null || true && \
    
    echo "=== Restart Docker with new PATH ===" && \
    systemctl set-environment PATH=/sbin:/usr/sbin:/usr/local/sbin:/usr/local/bin:/usr/bin:/bin 2>/dev/null || true && \
    systemctl reset-failed docker 2>/dev/null || true && \
    systemctl restart docker && sleep 5 && \
    docker info --format "Docker OK: {{.ServerVersion}}" && \
    
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
