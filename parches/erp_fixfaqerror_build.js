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

  // Bug real: el boton FAQ original hace "btn.onclick = abrirFaq;" (referencia inmediata)
  // ANTES de que "window.abrirFaq = function(){...}" se defina un poco mas abajo en el mismo
  // script. Esto tira un ReferenceError la primera vez que corre (aunque el setTimeout de
  // respaldo lo repara 800ms despues). Fix: buscar la firma exacta y unica de este bloque
  // especifico (para no tocar la copia correcta de SMFAQROLV1 que usa una referencia diferida)
  // y diferir tambien la primera llamada con setTimeout(...,0).
  const firma = "btn.onclick = abrirFaq;\n    const logoutBtn = topbar.querySelector('.logout');\n    if(logoutBtn){ topbar.insertBefore(btn, logoutBtn); }\n    else { topbar.appendChild(btn); }\n  }\n  addFaqButton();\n  setTimeout(addFaqButton, 800);";
  const cuentaFirma = html.split(firma).length - 1;
  if (cuentaFirma !== 1) {
    throw new Error('La firma del bug de FAQ no aparecio exactamente 1 vez (aparecio ' + cuentaFirma + '). Abortando para no arriesgar un cambio impreciso.');
  }
  const firmaCorregida = firma.replace('  addFaqButton();\n  setTimeout(addFaqButton, 800);', '  setTimeout(addFaqButton, 0);\n  setTimeout(addFaqButton, 800);');
  html = html.split(firma).join(firmaCorregida);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. Fix de ReferenceError abrirFaq aplicado (llamada diferida). len=' + html.length);
}

main().catch(err => { console.error(err); process.exit(1); });
