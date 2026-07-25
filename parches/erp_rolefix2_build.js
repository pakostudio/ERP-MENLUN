const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';

async function main() {
  const res = await fetch(LIVE_URL);
  let html = await res.text();

  const before = "{ id: 'tbLogisticaBtn', permitido: ['logistica','direccion','admin_sistemas'] },\n    { id: 'tbPedidosRecibirBtn', permitido: ['logistica','direccion','admin_sistemas'] },";
  const after = "{ id: 'tbLogisticaBtn', permitido: ['direccion','admin_sistemas'] },\n    { id: 'tbPedidosRecibirBtn', permitido: ['direccion','admin_sistemas'] },";

  if (!html.includes(before)) {
    throw new Error('No se encontro la cadena exacta de REGLAS a reemplazar. Abortando para no corromper el build.');
  }
  html = html.split(before).join(after);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. REGLAS de tbLogisticaBtn/tbPedidosRecibirBtn ya no incluyen logistica (se manejan solo por sidebar).');
}

main().catch(err => { console.error(err); process.exit(1); });
