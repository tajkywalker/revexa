import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    echo "=== Docker status ===" && systemctl status docker.service --no-pager && \
    echo "" && echo "=== Docker journal ===" && journalctl -xeu docker.service --no-pager -n 30 && \
    echo "" && echo "=== Disk space ===" && df -h && \
    echo "" && echo "=== Memory ===" && free -h && \
    echo "" && echo "=== Kernel ===" && uname -r
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end());
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
