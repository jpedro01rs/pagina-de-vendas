import config from '../config.js';
import { renderizar, playwrightDisponivel, abrirParaLogin } from '../lib/navegador.js';
import { extrairJsonEmbutido, garimparAnuncios } from '../lib/extrator.js';
import { precoParaNumero, extrairArmazenamento, extrairCondicao } from '../lib/texto.js';

export const ID = 'facebook';
export const NOME = 'Facebook Marketplace';
const BASE = 'https://www.facebook.com';

/**
 * ATENCAO - leia antes de ligar esta fonte.
 *
 * O Marketplace exige login e o Facebook proibe coleta automatizada nos seus
 * termos de uso. Automatizar a navegacao pode levar a bloqueio temporario ou
 * permanente da sua conta.
 *
 * Por isso esta fonte:
 *   - vem DESLIGADA por padrao (FONTE_FACEBOOK=false);
 *   - usa o SEU navegador e a SUA sessao (voce loga uma vez, manualmente);
 *   - vai devagar, com poucas paginas.
 *
 * Ela existe porque o Marketplace tem preco relevante no Brasil. A decisao de
 * usar e sua, com o risco explicito.
 */

export function montarUrl(termo, { cidade = '', raioKm = 60, precoMin, precoMax } = {}) {
  const local = cidade ? encodeURIComponent(cidade.toLowerCase().replace(/\s+/g, '')) : '';
  const url = new URL(`/marketplace/${local || 'search'}/search`, BASE);
  url.searchParams.set('query', termo);
  url.searchParams.set('exact', 'false');
  if (raioKm) url.searchParams.set('radius_km', String(raioKm));
  if (precoMin) url.searchParams.set('minPrice', String(precoMin));
  if (precoMax) url.searchParams.set('maxPrice', String(precoMax));
  return url.toString();
}

/** Plano B: varre os cards renderizados no HTML. */
export function extrairDoHtml(html) {
  const anuncios = [];
  const vistos = new Set();
  const padrao = /href="(\/marketplace\/item\/(\d+)[^"]*)"[^>]*>([\s\S]{0,1500}?)<\/a>/gi;

  for (const achado of html.matchAll(padrao)) {
    const [, caminho, id, interior] = achado;
    if (vistos.has(id)) continue;

    const texto = interior.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const precoAchado = texto.match(/R\$\s*([\d.]+(?:,\d{2})?)/);
    if (!precoAchado) continue;
    const preco = precoParaNumero(precoAchado[1]);
    if (!preco) continue;

    const depois = texto.slice(texto.indexOf(precoAchado[0]) + precoAchado[0].length).trim();
    const titulo = (depois.split(/\s{2,}/)[0] || depois).slice(0, 120).trim();
    if (titulo.length < 4) continue;

    vistos.add(id);
    anuncios.push({
      fonte: ID, idExterno: id, titulo, preco,
      url: new URL(caminho, BASE).toString(),
      imagem: null, cidade: null, uf: null, publicadoEm: null,
      armazenamento: extrairArmazenamento(titulo), condicao: extrairCondicao(titulo),
    });
  }
  return anuncios;
}

function pareceTelaDeLogin(html) {
  return /name="login_form"|id="loginbutton"|Entrar no Facebook|You must log in/i.test(html);
}

export class PrecisaLogin extends Error {
  constructor() {
    super('Sessao do Facebook ausente ou expirada. Rode: npm run doctor -- --login-facebook');
    this.name = 'PrecisaLogin';
  }
}

/** Coleta anuncios do Marketplace usando a sessao salva do usuario. */
export async function coletar(termo, opcoes = {}) {
  if (!await playwrightDisponivel()) {
    throw new Error('Facebook Marketplace exige o navegador. Rode: npm run navegador');
  }

  const url = montarUrl(termo, {
    cidade: opcoes.cidade ?? config.regiao.cidade,
    raioKm: opcoes.raioKm ?? 60,
    precoMin: opcoes.precoMin,
    precoMax: opcoes.precoMax,
  });

  const html = await renderizar(url, {
    persistente: true,
    esperarSeletor: 'a[href*="/marketplace/item/"]',
    esperaExtraMs: 2500,
  });

  if (pareceTelaDeLogin(html)) throw new PrecisaLogin();

  let anuncios = [];
  let via = 'html';
  for (const objeto of extrairJsonEmbutido(html)) {
    const achados = garimparAnuncios(objeto, { fonte: ID, baseUrl: BASE });
    if (achados.length) { anuncios = achados; via = 'json'; break; }
  }
  if (!anuncios.length) anuncios = extrairDoHtml(html);

  return { anuncios, diagnostico: { via, paginas: 1, metodo: 'navegador' } };
}

/** Abre o navegador para login manual, uma unica vez. */
export async function login() {
  const { contexto } = await abrirParaLogin(`${BASE}/login`, {
    mensagem: '\nFaca login no Facebook na janela que abriu.\nDepois de entrar no Marketplace, feche a janela para salvar a sessao.\n',
  });
  await new Promise((resolver) => contexto.on('close', resolver));
  console.log('Sessao salva em data/perfil-facebook.');
}
