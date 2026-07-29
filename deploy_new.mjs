import { Client } from 'ssh2';
import { readFileSync } from 'fs';

const NEW_IP   = '178.105.220.221';
const NEW_PASS = 'Wqw4trNrKa9q';
const script   = readFileSync('/tmp/full_setup.sh', 'utf8');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH connected to new server!\n');
  conn.exec('cat > /tmp/setup.sh && bash /tmp/setup.sh', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.stdin.write(script);
    stream.stdin.end();
    stream.on('close', c => { conn.end(); console.log('\nExit:', c); });
    stream.on('data', d => process.stdout.write(d.toString()));
    stream.stderr.on('data', d => process.stderr.write(d.toString()));
  });
});
conn.on('error', e => { console.error('SSH:', e.message); process.exit(1); });
conn.connect({ host: NEW_IP, port: 22, username: 'root', password: NEW_PASS, readyTimeout: 20000 });
