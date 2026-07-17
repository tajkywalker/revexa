import { Client } from 'ssh2';
import { readFileSync } from 'fs';

const conn = new Client();
const script = readFileSync('/tmp/deploy_pm2.sh', 'utf8');

conn.on('ready', () => {
  // Upload script and run it
  conn.exec('cat > /tmp/kss_deploy.sh && chmod +x /tmp/kss_deploy.sh && bash /tmp/kss_deploy.sh', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.stdin.write(script);
    stream.stdin.end();
    stream.on('close', c => { conn.end(); console.log('\nExit', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error(e.message); process.exit(1); });
conn.connect({ host: '167.233.233.156', port: 22, username: 'root', password: 'bqTAsqrerhLh', readyTimeout: 15000 });
