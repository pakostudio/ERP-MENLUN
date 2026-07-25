const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';

async function main() {
  const res = await fetch(LIVE_URL);
  if (!res.ok) { throw new Error('No se pudo obtener el HTML en vivo: status ' + res.status); }
  let html = await res.text();
  if (!html.includes('<script') || html.length < 100000) {
    throw new Error('El HTML en vivo se ve incompleto (len=' + html.length + '). Abortando.');
  }

  html = html.replace(/<script>\s*\/\*\s*SMLOGCRUDV1[\s\S]*?<\/script>\s*/g, '');
  const stripV2 = /<script>\s*\/\*\s*SMLOGCRUDV2[\s\S]*?<\/script>\s*/g;
  if (!stripV2.test(html)) {
    throw new Error('No se encontro SMLOGCRUDV2 en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.replace(stripV2, '');

  const patch = fs.readFileSync(path.join(__dirname, 'erp_logcrud_v2_patch.txt'), 'utf8');

  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) { throw new Error('No se encontro </body>. Abortando.'); }
  html = html.slice(0, bodyClose) + patch + html.slice(bodyClose);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMLOGCRUDV2 (modal propio, fix costo_x_kg generado) instalado. len=' + html.length);
}

main().catch(err => { console.error(err); process.exit(1); });
