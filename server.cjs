const http = require('node:http');
const next = require('next');
const { attachSocket } = require('./lib/socket.cjs');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
app.prepare().then(() => {
  const handler = app.getRequestHandler();
  const server = http.createServer((req, res) => handler(req, res));
  attachSocket(server);
  server.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('Bingo server ready'));
}).catch(error => { console.error(error); process.exit(1); });
