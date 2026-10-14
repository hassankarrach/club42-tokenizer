// Serve only deployment assets, bound to this computer. No wallet keys are used.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const routes = {
  '/': ['deployment/index.html', 'text/html'],
  '/treasury': ['deployment/treasury.html', 'text/html'],
  '/treasury-config.json': ['deployment/treasury-config.json', 'application/json'],
  '/treasury-artifact.json': ['artifacts/Club42Treasury.json', 'application/json'],
  '/deploy.js': ['deployment/deploy.js', 'text/javascript'],
  '/ethers.js': ['node_modules/ethers/dist/ethers.umd.min.js', 'text/javascript'],
  '/artifact.json': ['artifacts/Club42.json', 'application/json']
};
http.createServer((req, res) => {
  const route = routes[req.url];
  if (req.method !== 'GET' || !route) { res.writeHead(404); res.end(); return; }
  res.setHeader('Content-Type', route[1]);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.readFile(path.join(root, route[0]), (error, data) => {
    if (error) { res.writeHead(500); res.end('Asset unavailable. Run npm run compile.'); return; }
    res.end(data);
  });
}).listen(4243, '127.0.0.1', () => console.log('Open http://127.0.0.1:4243 in Brave. Stop with Ctrl+C.'));
