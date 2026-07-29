import { Client } from 'ssh2';
import { readFileSync } from 'fs';
const conn = new Client();
const script = readFileSync('/tmp/fix3.sh', 'utf8');
conn.on('ready', () => {
  conn.exec('cat > /tmp/f3.sh && bash /tmp/f3.sh', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.stdin.write(script);
    stream.stdin.end();
    stream.on('close', c => { conn.end(); console.log('\nExit:', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH:', e.message); process.exit(1); });
conn.connect({ host: '178.105.220.221', port: 22, username: 'root', password: 'Wqw4trNrKa9q', readyTimeout: 20000 });
