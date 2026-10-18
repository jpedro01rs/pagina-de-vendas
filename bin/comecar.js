#!/usr/bin/env node
/**
 * Instala tudo e abre o app. Um comando so:
 *
 *   npm run comecar
 *
 * Faz, em ordem: confere o Node, instala as dependencias, baixa o Chromium,
 * cria o .env, sobe o servidor e abre o navegador na pagina.
 * Pode rodar quantas vezes quiser - ele pula o que ja esta pronto.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ehWindows = process.platform === 'win32';
const npm = ehWindows ? 'npm.cmd' : 'npm';
const npx = ehWindows ? 'npx.cmd' : 'npx';

const passo = (n, texto) => console.log(`\n[${n}/5] ${texto}`);
const ok = (texto) => console.log(`      ok - ${texto}`);
const aviso = (texto) => console.log(`      ! ${texto}`);

function rodar(comando, argumentos, { silencioso = false } = {}) {
  const r = spawnSync(comando, argumentos, {
    cwd: RAIZ,
    stdio: silencioso ? 'pipe' : 'inherit',
    shell: ehWindows,
  });
  return r.status === 0;
}

console.log('\n==============================================');
console.log('  REVENDA RADAR - instalacao');
console.log('==============================================');

/* 1. Node ------------------------------------------------------------- */
passo(1, 'Conferindo o Node.js');
const maior = Number(process.versions.node.split('.')[0]);
if (maior < 20) {
  console.error(`\n  Seu Node e a versao ${process.versions.node}, e o app precisa da 20 ou maior.`);
  console.error('  Baixe a versao LTS em https://nodejs.org e rode este comando de novo.\n');
  process.exit(1);
}
ok(`Node ${process.versions.node}`);

/* 2. Dependencias ----------------------------------------------------- */
passo(2, 'Instalando dependencias');
if (fs.existsSync(path.join(RAIZ, 'node_modules', 'express'))) {
  ok('ja instaladas');
} else {
  if (!rodar(npm, ['install', '--no-audit', '--no-fund'])) {
    console.error('\n  Falhou ao instalar. Confira sua internet e rode: npm install\n');
    process.exit(1);
  }
  ok('dependencias instaladas');
}

/* 3. Navegador -------------------------------------------------------- */
passo(3, 'Preparando o navegador (a OLX bloqueia acesso sem ele)');
let navegadorPronto = false;
try {
  const { chromium } = await import('playwright');
  const caminho = chromium.executablePath();
  navegadorPronto = !!caminho && fs.existsSync(caminho);
} catch { /* playwright ausente */ }

if (navegadorPronto) {
  ok('Chromium ja instalado');
} else {
  console.log('      baixando o Chromium (pode levar alguns minutos)...');
  if (rodar(npx, ['playwright', 'install', 'chromium'])) ok('Chromium instalado');
  else aviso('nao consegui baixar. O app abre assim mesmo, mas a OLX pode bloquear. Rode depois: npm run navegador');
}

/* 4. Configuracao ----------------------------------------------------- */
passo(4, 'Criando o arquivo de configuracao');
const env = path.join(RAIZ, '.env');
if (fs.existsSync(env)) {
  ok('.env ja existe');
} else {
  fs.copyFileSync(path.join(RAIZ, '.env.example'), env);
  ok('.env criado (voce ajusta a regiao pela propria tela do app)');
}

/* 5. Servidor --------------------------------------------------------- */
const porta = Number(process.env.PORT) || 3000;
const endereco = `http://localhost:${porta}`;
passo(5, 'Abrindo o app');

const servidor = spawn(process.execPath, [path.join(RAIZ, 'src', 'server.js')], {
  cwd: RAIZ, stdio: 'inherit', env: { ...process.env, PORT: String(porta) },
});

// Espera a porta responder antes de abrir o navegador.
const ate = Date.now() + 20000;
while (Date.now() < ate) {
  try {
    const r = await fetch(`${endereco}/api/saude`);
    if (r.ok) break;
  } catch { /* ainda subindo */ }
  await new Promise((r) => setTimeout(r, 400));
}

const abrir = ehWindows ? ['cmd', ['/c', 'start', '', endereco]]
  : process.platform === 'darwin' ? ['open', [endereco]]
  : ['xdg-open', [endereco]];
spawnSync(abrir[0], abrir[1], { stdio: 'ignore', shell: ehWindows });

console.log('\n==============================================');
console.log(`  Pronto. O app esta em ${endereco}`);
console.log('');
console.log('  1. Va na aba "Configuracao" e coloque sua cidade e estado.');
console.log('  2. Va em "Tabela de precos" e clique em "Atualizar tabela".');
console.log('     (ou use "Buscar item" para consultar algo na hora)');
console.log('');
console.log('  Para fechar: Ctrl+C');
console.log('  Da proxima vez, so: npm start');
console.log('==============================================\n');

const encerrar = () => { servidor.kill(); process.exit(0); };
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
servidor.on('exit', (codigo) => process.exit(codigo ?? 0));
