import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash -lc '
    export PATH=/usr/sbin:/usr/local/sbin:$PATH

    echo "=== Top memory consumers ==="
    ps aux --sort=-%mem | head -15

    echo ""
    echo "=== Memory ==="
    free -h

    echo ""
    echo "=== Try to free some memory ==="
    sync && echo 3 > /proc/sys/vm/drop_caches
    free -h | grep Mem

    echo ""
    echo "=== Try docker compose with less memory ==="
    cd /opt/kovosrotsoft
    
    # Only start backend (skip frontend build container)
    DOCKER_BUILDKIT=0 /usr/libexec/docker/cli-plugins/docker-compose up -d backend 2>&1 | tail -20
    
    sleep 5
    /usr/libexec/docker/cli-plugins/docker-compose ps 2>/dev/null
    curl -s -o /dev/null -w "App: HTTP %{http_code}\\n" http://localhost:3001/ 2>/dev/null || echo "Not responding"
  '`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
