import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`bash -lc '
    set -e
    export PATH=/usr/sbin:/usr/local/sbin:$PATH

    echo "=== Find docker-compose binary ==="
    find / -name "docker-compose*" -type f 2>/dev/null | grep -v proc | head -10
    dpkg -L docker-compose-plugin 2>/dev/null | grep compose

    echo ""
    echo "=== Docker info ==="  
    docker --version
    docker info 2>&1 | head -10

    echo ""
    echo "=== Use docker-compose directly ==="
    COMPOSE=$(find / -name "docker-compose" -type f 2>/dev/null | head -1)
    echo "Found: $COMPOSE"
    
    echo ""
    echo "=== Start app with docker-compose directly ==="
    cd /opt/kovosrotsoft
    $COMPOSE up -d
    sleep 8
    $COMPOSE ps
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
