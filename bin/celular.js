#!/usr/bin/env node
/**
 * Prepara e sobe o app para uso no celular.
 *
 *   npm run celular
 *
 * Confere o que costuma dar errado (maquina sem rede, senha ausente quando
 * exposta pra fora), mostra o endereco e o QR, e sobe o servidor.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import config from '../src/config.js';
import { enderecosDaRede } from '../src/lib/rede.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const traco = '='.repeat(52);

console.log(`\n${traco}\n  REVENDA RADAR NO CELULAR\n${traco}`);

const enderecos = enderecosDaRede();

if (!enderecos.length) {
  console.log('\n  PROBLEMA: este computador nao esta numa rede local.');
  console.log('  Conecte no Wi-Fi (o mesmo do celular) e rode de novo.\n');
  process.exit(1);
}

console.log('\n  Como funciona:');
console.log('    O computador faz a busca nos marketplaces (a OLX exige isso).');
console.log('    O celular so abre a tela. Deixe o computador ligado.');

console.log('\n  Passo a passo:');
console.log('    1. Confira que o celular esta no MESMO Wi-Fi que este computador.');
console.log(`    2. Aponte a camera do celular para o QR que vai aparecer.`);
console.log('    3. No celular, use "Adicionar a tela de inicio" para virar app:');
console.log('       iPhone  - Safari, botao Compartilhar, "Adicionar a Tela de Inicio"');
console.log('       Android - Chrome, menu de tres pontos, "Adicionar a tela inicial"');

if (!config.senha) {
  console.log('\n  Aviso: sem senha definida.');
  console.log('  Na sua rede de casa tudo bem. So defina SENHA no .env se for');
  console.log('  expor o app para fora do Wi-Fi (tunel).');
}

console.log(`\n${traco}\n`);

const servidor = spawn(process.execPath, [path.join(RAIZ, 'src', 'server.js')], {
  cwd: RAIZ, stdio: 'inherit', env: process.env,
});

const encerrar = () => { servidor.kill(); process.exit(0); };
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
servidor.on('exit', (codigo) => process.exit(codigo ?? 0));
