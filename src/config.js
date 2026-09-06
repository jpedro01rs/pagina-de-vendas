import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DATA_DIR = path.join(ROOT, 'data');

/** Leitor de .env sem dependencia externa. */
function carregarEnv(arquivo) {
  if (!fs.existsSync(arquivo)) return;
  for (const bruta of fs.readFileSync(arquivo, 'utf8').split('\n')) {
    const linha = bruta.trim();
    if (!linha || linha.startsWith('#')) continue;
    const igual = linha.indexOf('=');
    if (igual === -1) continue;
    const chave = linha.slice(0, igual).trim();
    let valor = linha.slice(igual + 1).trim();
    const aspas = (valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"));
    if (aspas) valor = valor.slice(1, -1);
    if (!(chave in process.env)) process.env[chave] = valor;
  }
}
carregarEnv(path.join(ROOT, '.env'));

const num = (v, padrao) => { const n = Number(v); return Number.isFinite(n) ? n : padrao; };
const bool = (v, padrao) => (v === undefined || v === '' ? padrao : ['1', 'true', 'yes', 'sim', 'on'].includes(String(v).toLowerCase()));

export const config = {
  porta: num(process.env.PORT, 3000),
  regiao: {
    uf: (process.env.UF || '').toLowerCase().trim(),
    slug: (process.env.REGIAO || '').toLowerCase().trim(),
    cidade: (process.env.CIDADE || '').trim(),
  },
  fontes: {
    olx: bool(process.env.FONTE_OLX, true),
    enjoei: bool(process.env.FONTE_ENJOEI, true),
    facebook: bool(process.env.FONTE_FACEBOOK, false),
  },
  coleta: {
    maxPaginas: num(process.env.MAX_PAGINAS, 2),
    delayMs: num(process.env.DELAY_MS, 1500),
    timeoutMs: num(process.env.TIMEOUT_MS, 30000),
    tentativas: num(process.env.RETRIES, 2),
    usarNavegador: bool(process.env.USAR_NAVEGADOR, true),
    headless: bool(process.env.HEADLESS, true),
    userAgent: process.env.USER_AGENT
      || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  },
  cacheMin: num(process.env.CACHE_MIN, 180),
  negocio: {
    descontoVendaRapida: num(process.env.DESCONTO_VENDA_RAPIDA, 0.08),
    custoFixo: num(process.env.CUSTO_FIXO, 30),
    taxaPlataforma: num(process.env.TAXA_PLATAFORMA, 0),
    lucroMinimo: num(process.env.LUCRO_MINIMO, 100),
    roiMinimo: num(process.env.ROI_MINIMO, 0.12),
  },
  estatistica: {
    iqrK: num(process.env.IQR_K, 1.5),
    minAmostra: num(process.env.MIN_AMOSTRA, 5),
  },
};

export default config;
