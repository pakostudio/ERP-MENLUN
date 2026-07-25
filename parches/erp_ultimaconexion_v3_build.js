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

  const stripV1 = /<script>\s*\/\*\s*SMULTIMACONEXIONV1[\s\S]*?<\/script>\s*/g;
  if (!stripV1.test(html)) {
    throw new Error('No se encontro SMULTIMACONEXIONV1 en el HTML en vivo. Abortando para no corromper el build.');
  }
  html = html.replace(stripV1, '');
  html = html.replace(/<script>\s*\/\*\s*SMULTIMACONEXIONV2[\s\S]*?<\/script>\s*/g, '');
  html = html.replace(/<script>\s*\/\*\s*SMULTIMACONEXIONV3[\s\S]*?<\/script>\s*/g, '');

  const patch = fs.readFileSync(path.join(__dirname, 'erp_ultimaconexion_v3_patch.txt'), 'utf8');

  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) { throw new Error('No se encontro </body>. Abortando.'); }
  html = html.slice(0, bodyClose) + patch + html.slice(bodyClose);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMULTIMACONEXIONV3 instalado (linea sutil por usuario, sin parpadeo). len=' + html.length);
}

main().catch(err => { console.error(err); process.exit(1); });
