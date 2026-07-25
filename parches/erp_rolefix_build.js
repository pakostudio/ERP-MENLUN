const fs = require('fs');
const path = require('path');

const LIVE_URL = 'https://erp-menlun.vercel.app/';

async function main() {
  const res = await fetch(LIVE_URL);
  let html = await res.text();

  const before = "var _roleFixTries = 0;\n  var _roleFixPoll = setInterval(function(){\n    aplicarReglas();\n    _roleFixTries++;\n    if(_roleFixTries > 80) clearInterval(_roleFixPoll);\n  }, 300);";
  const after = "var _roleFixPoll = setInterval(function(){\n    aplicarReglas();\n  }, 500);";

  if (!html.includes(before)) {
    throw new Error('No se encontro la cadena exacta del poll de SMROLEFIXV1. Abortando para no corromper el build.');
  }
  html = html.split(before).join(after);

  fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'public', 'index.html'), html);
  console.log('Build complete. SMROLEFIXV1 ahora corre de forma permanente.');
}

main().catch(err => { console.error(err); process.exit(1); });
