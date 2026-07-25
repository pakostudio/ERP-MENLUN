const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';
const MARKER = 'SMLOGCRUDV1';

async function main() {
  const res = await fetch(LIVE_URL);
  let html = await res.text();

  // Strip any previously injected copy of this exact patch (idempotent redeploy)
  const stripRe = new RegExp('<script>\\s*/\\*\\s*' + MARKER + '[\\s\\S]*?</script>\\s*', 'g');
  html = html.replace(stripRe, '');

  const patch = fs.readFileSync(path.join(__dirname, 'erp_logcrud_patch.txt'), 'utf8');

  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) {
    throw new Error('No se encontro </body> en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.slice(0, bodyClose) + patch + html.slice(bodyClose);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMLOGCRUDV1 inyectado antes de </body>.');
}

main().catch(err => { console.error(err); process.exit(1); });
