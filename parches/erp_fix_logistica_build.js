const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';

async function main() {
  const res = await fetch(LIVE_URL);
  let html = await res.text();

  let n = 0;
  html = html.replace(/(id:\s*'tbLogisticaBtn',\s*permitido:\s*\[)'logistica'(\])/, (m, a, b) => { n++; return a + "'logistica','direccion','admin_sistemas'" + b; });
  html = html.replace(/(id:\s*'tbPedidosRecibirBtn',\s*permitido:\s*\[)'logistica'(\])/, (m, a, b) => { n++; return a + "'logistica','direccion','admin_sistemas'" + b; });

  if (n !== 2) {
    throw new Error('No se encontraron las 2 reglas esperadas a reemplazar (encontradas: ' + n + '). Abortando para no corromper el build.');
  }

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. Reglas actualizadas:', n);
}

main().catch(err => { console.error(err); process.exit(1); });
