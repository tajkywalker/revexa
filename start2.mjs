import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash -lc '
    set -e
    export PATH=/usr/sbin:/usr/local/sbin:$PATH

    echo "=== Docker plugins ==="
    ls /usr/lib/docker/cli-plugins/ 2>/dev/null || echo "no plugins dir"
    ls /usr/local/lib/docker/cli-plugins/ 2>/dev/null || echo "no local plugins"
    ls ~/.docker/cli-plugins/ 2>/dev/null || echo "no user plugins"

    echo ""
    echo "=== Install docker-compose-plugin ==="
    DEBIAN_FRONTEND=noninteractive apt-get install -y docker-compose-plugin 2>&1 | tail -5

    echo ""
    echo "=== Test compose ==="
    docker compose version

    echo ""
    echo "=== Start KovošrotSoft ==="
    cd /opt/kovosrotsoft
    docker compose up --detach
    sleep 8
    docker compose ps
    curl -s -o /dev/null -w "App: HTTP %{http_code}\\n" http://localhost:3001/
  '`, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
