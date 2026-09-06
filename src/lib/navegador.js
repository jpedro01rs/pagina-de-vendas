import fs from 'node:fs';
import path from 'node:path';
import config, { DATA_DIR } from '../config.js';

/**
 * Camada opcional de navegador (Playwright).
 *
 * A OLX usa protecao anti-bot que costuma barrar requisicao HTTP simples.
 * Quando isso acontece, renderizamos a pagina num Chromium real, que executa
 * o JavaScript de verificacao e devolve o HTML final.
 *
 * O Playwright e uma dependencia OPCIONAL: se nao estiver instalado, o sistema
 * continua funcionando apenas com HTTP e avisa no diagnostico.
 */

let playwrightCache;
let navegadorCache;
let contextoPersistente;

/**
 * Diz se da para usar o navegador de verdade.
 * Checa as DUAS coisas: o pacote instalado E o binario do Chromium baixado.
 * Sem essa segunda checagem, a falha vira um banner enorme do Playwright que
 * esconde a causa real.
 */
export async function playwrightDisponivel() {
  return (await estadoDoNavegador()).pronto;
}

export async function estadoDoNavegador() {
  let playwright;
  try {
    playwright = await carregarPlaywright();
  } catch {
    return { pronto: false, motivo: 'pacote', mensagem: 'Playwright nao instalado. Rode: npm install' };
  }

  try {
    const caminho = playwright.chromium.executablePath();
    if (caminho && fs.existsSync(caminho)) return { pronto: true, motivo: null, caminho };
    return {
      pronto: false, motivo: 'binario', caminho,
      mensagem: 'Chromium nao baixado. Rode: npm run navegador',
    };
  } catch (erro) {
    return { pronto: false, motivo: 'binario', mensagem: `Chromium indisponivel: ${erro.message}` };
  }
}

async function carregarPlaywright() {
  if (playwrightCache) return playwrightCache;
  playwrightCache = await import('playwright');
  return playwrightCache;
}

async function obterNavegador() {
  if (navegadorCache) return navegadorCache;
  const { chromium } = await carregarPlaywright();
  navegadorCache = await chromium.launch({
    headless: config.coleta.headless,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
  });
  return navegadorCache;
}

const OPCOES_CONTEXTO = {
  locale: 'pt-BR',
  timezoneId: 'America/Sao_Paulo',
  viewport: { width: 1366, height: 900 },
  userAgent: config.coleta.userAgent,
  extraHTTPHeaders: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
};

/**
 * Contexto persistente: guarda cookies/sessao em disco.
 * Usado pelo Facebook Marketplace, onde voce faz login uma vez.
 */
export async function obterContextoPersistente() {
  if (contextoPersistente) return contextoPersistente;
  const { chromium } = await carregarPlaywright();
  contextoPersistente = await chromium.launchPersistentContext(
    path.join(DATA_DIR, 'perfil-facebook'),
    { headless: config.coleta.headless, args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'], ...OPCOES_CONTEXTO },
  );
  return contextoPersistente;
}

/** Renderiza a URL e devolve o HTML final. */
export async function renderizar(url, { esperarSeletor = null, persistente = false, esperaExtraMs = 1200 } = {}) {
  const contexto = persistente
    ? await obterContextoPersistente()
    : await (await obterNavegador()).newContext(OPCOES_CONTEXTO);

  const pagina = await contexto.newPage();
  try {
    // Bloqueia imagem/fonte/midia: a pagina carrega bem mais rapido.
    await pagina.route('**/*', (rota) => {
      const tipo = rota.request().resourceType();
      if (['image', 'media', 'font'].includes(tipo)) return rota.abort();
      return rota.continue();
    });

    await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: config.coleta.timeoutMs });
    if (esperarSeletor) {
      await pagina.waitForSelector(esperarSeletor, { timeout: 8000 }).catch(() => {});
    }
    await pagina.waitForTimeout(esperaExtraMs);
    return await pagina.content();
  } finally {
    await pagina.close().catch(() => {});
    if (!persistente) await contexto.close().catch(() => {});
  }
}

/** Abre o navegador visivel para o usuario fazer login manualmente. */
export async function abrirParaLogin(url, { mensagem = '' } = {}) {
  const { chromium } = await carregarPlaywright();
  const contexto = await chromium.launchPersistentContext(
    path.join(DATA_DIR, 'perfil-facebook'),
    { headless: false, args: ['--no-sandbox'], ...OPCOES_CONTEXTO },
  );
  const pagina = contexto.pages()[0] || await contexto.newPage();
  await pagina.goto(url, { waitUntil: 'domcontentloaded' });
  if (mensagem) console.log(mensagem);
  return { contexto, pagina };
}

export async function encerrarNavegador() {
  await navegadorCache?.close().catch(() => {});
  await contextoPersistente?.close().catch(() => {});
  navegadorCache = undefined;
  contextoPersistente = undefined;
}
