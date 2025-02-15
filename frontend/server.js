// server.js
// Ensure your package.json in frontend has "type": "module" (or use the --experimental-modules flag)
// so that this file is treated as an ES module.

import serve from 'serve';

const port = process.env.PORT || 3000;
const folder = process.env.SERVE_FOLDER || '/var/www/frontend';

const server = serve(folder, {
  port,
  single: true, // optional, depending on your SPA routing needs
});

console.log(`Static server running on port ${port}, serving folder ${folder}`);
