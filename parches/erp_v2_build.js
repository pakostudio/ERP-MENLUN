const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';

async function main() {
  const res = await fetch(LIVE_URL);
  let html = await res.text();

  // 1) Quitar SMSIDEBARV1 (viejo) por completo
  const stripSidebarV1 = /<script>\s*\/\*\s*SMSIDEBARV1[\s\S]*?<\/script>\s*/g;
  if (!stripSidebarV1.test(html)) {
    throw new Error('No se encontro SMSIDEBARV1 en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.replace(stripSidebarV1, '');

  // 2) Quitar SMNAVWATCHV1 (viejo) por completo
  const stripNavWatchV1 = /<script>\s*\/\*\s*SMNAVWATCHV1[\s\S]*?<\/script>\s*/g;
  if (!stripNavWatchV1.test(html)) {
    throw new Error('No se encontro SMNAVWATCHV1 en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.replace(stripNavWatchV1, '');

  // 3) Quitar copias previas de V2 (idempotente en redeploys)
  html = html.replace(/<script>\s*\/\*\s*SMSIDEBARV2[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<script>\s*\/\*\s*SMNAVWATCHV2[\s\S]*?<\/script>\s*/g, '');

  const sidebarPatch = fs.readFileSync(path.join(__dirname, 'erp_sidebar_v2_patch.txt'), 'utf8');
  const navwatchPatch = fs.readFileSync(path.join(__dirname, 'erp_navwatch2_patch.txt'), 'utf8');

  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) {
    throw new Error('No se encontro </body> en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.slice(0, bodyClose) + sidebarPatch + navwatchPatch + html.slice(bodyClose);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMSIDEBARV2 + SMNAVWATCHV2 instalados, V1 removidos.');
}

main().catch(err => { console.error(err); process.exit(1); });
