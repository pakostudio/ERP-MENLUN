const fs = require('fs');
const path = require('path');

// Deployment confirmado como funcional (login renderiza bien), tomado ANTES
// de inyectar SMSIDEBARV2/SMNAVWATCHV2 (que rompieron produccion).
const GOOD_URL = 'https://erp-menlun-3aym68qa8-sm-soluciones-projects.vercel.app/';

async function main() {
  const res = await fetch(GOOD_URL);
  if (!res.ok) {
    throw new Error('No se pudo obtener el HTML bueno de respaldo: status ' + res.status);
  }
  const html = await res.text();
  if (!html.includes('<script') || html.length < 100000) {
    throw new Error('El HTML de respaldo se ve incompleto (len=' + html.length + '). Abortando.');
  }

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Restore complete. Produccion vuelve al ultimo estado funcional conocido.');
}

main().catch(err => { console.error(err); process.exit(1); });
