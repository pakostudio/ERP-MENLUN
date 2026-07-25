const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';

async function main() {
  const res = await fetch(LIVE_URL);
  if (!res.ok) {
    throw new Error('No se pudo obtener el HTML en vivo: status ' + res.status);
  }
  let html = await res.text();
  if (!html.includes('<script') || html.length < 100000) {
    throw new Error('El HTML en vivo se ve incompleto (len=' + html.length + '). Abortando.');
  }

  // Quitar version vieja del sidebar (V1) por completo
  const stripSidebarV1 = /<script>\s*\/\*\s*SMSIDEBARV1[\s\S]*?<\/script>\s*/g;
  if (!stripSidebarV1.test(html)) {
    throw new Error('No se encontro SMSIDEBARV1 en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.replace(stripSidebarV1, '');

  // Quitar SMNAVWATCHV1 (viejo, solo arreglaba display, no restauraba elementos eliminados)
  const stripNavWatchV1 = /<script>\s*\/\*\s*SMNAVWATCHV1[\s\S]*?<\/script>\s*/g;
  if (!stripNavWatchV1.test(html)) {
    throw new Error('No se encontro SMNAVWATCHV1 en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.replace(stripNavWatchV1, '');

  // Idempotente: quitar copias previas de V2/V3 si existieran
  html = html.replace(/<script>\s*\/\*\s*SMSIDEBARV2[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<script>\s*\/\*\s*SMSIDEBARV3[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<script>\s*\/\*\s*SMNAVWATCHV2[\s\S]*?<\/script>\s*/g, '');

  const sidebarPatch = fs.readFileSync(path.join(__dirname, 'erp_sidebar_v3_patch.txt'), 'utf8');
  const navwatchPatch = fs.readFileSync(path.join(__dirname, 'erp_navwatch2_patch.txt'), 'utf8');

  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) {
    throw new Error('No se encontro </body> en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.slice(0, bodyClose) + sidebarPatch + navwatchPatch + html.slice(bodyClose);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMSIDEBARV3 (fix seguro) + SMNAVWATCHV2 instalados, V1 removidos.');
}

main().catch(err => { console.error(err); process.exit(1); });
