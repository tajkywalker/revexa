import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  // Use a shell so we get proper PATH with /usr/sbin for iptables
  conn.exec(`bash -lc '
    set -e
    export PATH=/usr/sbin:/usr/local/sbin:$PATH
    
    echo "=== Docker check ==="
    docker info --format "Docker: {{.ServerVersion}}" 2>&1 | head -3
    
    echo ""
    echo "=== iptables check ==="
    which iptables && iptables --version
    
    echo ""
    echo "=== Start app ==="
    cd /opt/kovosrotsoft
    docker compose version
    docker compose up --detach
    
    sleep 8
    echo ""
    echo "=== Status ==="
    docker compose ps
    
    echo ""
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
