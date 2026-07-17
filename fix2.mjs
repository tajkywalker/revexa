import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Docker detailed error ===" && \
    journalctl -xeu docker.service --no-pager -n 50 2>&1 | grep -i "err\\|fail\\|warn\\|cgroup\\|overlay\\|iptab" | head -20 && \
    echo "" && echo "=== dockerd direct test ===" && \
    dockerd --version && \
    echo "" && echo "=== containerd status ===" && \
    systemctl status containerd --no-pager | head -10 && \
    echo "" && echo "=== Try starting containerd first ===" && \
    systemctl start containerd && sleep 2 && \
    echo "" && echo "=== Reset Docker socket ===" && \
    systemctl stop docker.socket 2>/dev/null; systemctl reset-failed docker 2>/dev/null; \
    systemctl start docker && sleep 3 && \
    echo "Docker started OK" || echo "Docker STILL failing"
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end());
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
