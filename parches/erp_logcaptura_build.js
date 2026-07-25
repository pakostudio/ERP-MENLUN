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

  // idempotente: quitar copia previa si existiera
  html = html.replace(/<script>\s*\/\*\s*SMLOGCAPTURAV1[\s\S]*?<\/script>\s*/g, '');

  // Actualizar FAQ de logistica por posicion (evita fragilidad de match literal en HTML minificado)
  const marker = 'SMFAQROLV1';
  const markerPos = html.indexOf(marker);
  if (markerPos === -1) { throw new Error('No se encontro el marcador SMFAQROLV1. Abortando.'); }
  const logisticaKeyPos = html.indexOf('logistica:', markerPos);
  if (logisticaKeyPos === -1) { throw new Error('No se encontro el bloque logistica: dentro del FAQ. Abortando.'); }
  const almacenKeyPos = html.indexOf('almacen:', logisticaKeyPos);
  if (almacenKeyPos === -1) { throw new Error('No se encontro el bloque almacen: despues de logistica. Abortando.'); }
  // dentro de la ventana [logisticaKeyPos, almacenKeyPos), buscar la ultima aparicion de "¿Qué pasa si mi pregunta no está aquí?"
  const cierreTexto = 'pregunta no está aquí?';
  const ventana = html.slice(logisticaKeyPos, almacenKeyPos);
  const cierreRel = ventana.lastIndexOf(cierreTexto);
  if (cierreRel === -1) { throw new Error('No se encontro el item de cierre de FAQ dentro del bloque logistica. Abortando.'); }
  // retroceder hasta el inicio del array item: buscar el "['" que abre esa entrada
  const cierreAbs = logisticaKeyPos + cierreRel;
  const itemStartAbs = html.lastIndexOf("['", cierreAbs);
  if (itemStartAbs === -1 || itemStartAbs < logisticaKeyPos) { throw new Error('No se pudo ubicar el inicio del item de cierre. Abortando.'); }

  const nuevosItems =
    "['¿Cómo agrego un pedido nuevo al Flujo Operativo?', 'Entra a \"Flujo Operativo\" y usa el botón \"+ Nuevo pedido\" arriba del listado. Captura folio y cliente, se agrega en la etapa \"Pedido\".'],\n        " +
    "['¿Cómo registro un bloqueo nuevo?', 'Entra a \"Bloqueos\" y usa el botón \"+ Nuevo bloqueo\". Si el tipo o área es Logística, se te notifica automáticamente por correo.'],\n        " +
    "['¿Me avisan si hay algo nuevo?', 'Sí, si tú u otra persona registra un pedido nuevo o un bloqueo que afecta a Logística, te llega un correo automático.'],\n        ";

  html = html.slice(0, itemStartAbs) + nuevosItems + html.slice(itemStartAbs);

  const patch = fs.readFileSync(path.join(__dirname, 'erp_logcaptura_patch.txt'), 'utf8');

  const bodyClose = html.lastIndexOf('</body>');
  if (bodyClose === -1) { throw new Error('No se encontro </body>. Abortando.'); }
  html = html.slice(0, bodyClose) + patch + html.slice(bodyClose);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMLOGCAPTURAV1 instalado + FAQ logistica actualizado (por posicion). len=' + html.length);
}

main().catch(err => { console.error(err); process.exit(1); });
