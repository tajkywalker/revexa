import { Client } from 'ssh2';
const conn = new Client();
conn.on('ready', () => {
  conn.exec(`
    export DEBIAN_FRONTEND=noninteractive
    export DEBCONF_NONINTERACTIVE_SEEN=true
    
    echo "=== Fix tzdata + install iptables ===" && \
    ln -fs /usr/share/zoneinfo/Europe/Prague /etc/localtime 2>/dev/null || true && \
    dpkg --configure -a --force-confdef --force-confnew 2>/dev/null || true && \
    apt-get install -y -qq --fix-broken iptables iptables-persistent 2>&1 | tail -5 && \
    which iptables && iptables --version && \
    echo "" && echo "=== Restart Docker ===" && \
    systemctl reset-failed docker 2>/dev/null || true && \
    systemctl restart docker && sleep 4 && \
    docker info | grep "Server Version" && \
    echo "" && echo "=== Start app ===" && \
    cd /opt/kovosrotsoft && docker compose up -d && sleep 8 && \
    docker compose ps && \
    echo "" && curl -s -o /dev/null -w "RESULT: HTTP %{http_code}\\n" http://localhost:3001/
  `, (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
