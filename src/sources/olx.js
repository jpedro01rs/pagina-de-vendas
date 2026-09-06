import config from '../config.js';
import { buscar, pareceDesafio, ErroDeColeta } from '../lib/http.js';
import { renderizar, playwrightDisponivel } from '../lib/navegador.js';
import { extrairJsonEmbutido, garimparAnuncios } from '../lib/extrator.js';
import { precoParaNumero, extrairArmazenamento, extrairCondicao } from '../lib/texto.js';

export const ID = 'olx';
export const NOME = 'OLX';
const BASE = 'https://www.olx.com.br';

/**
 * Monta a URL de busca da OLX.
 * Estrutura: /brasil?q=  |  /estado-sp?q=  |  /estado-sp/sao-paulo-e-regiao?q=
 */
export function montarUrl(termo, { uf, regiao, pagina = 1, precoMin, precoMax } = {}) {
  let caminho = '/brasil';
  if (uf) caminho = regiao ? `/estado-${uf}/${regiao}` : `/estado-${uf}`;

  const url = new URL(caminho, BASE);
  url.searchParams.set('q', termo);
  if (pagina > 1) url.searchParams.set('o', String(pagina));
  if (precoMin) url.searchParams.set('ps', String(precoMin));
  if (precoMax) url.searchParams.set('pe', String(precoMax));
  return url.toString();
}

/**
 * Plano B: le os cards direto do HTML quando o JSON embutido muda de formato.
 * Procura links de anuncio e o preco mais proximo dentro do mesmo bloco.
 */
export function extrairDoHtml(html) {
  const anuncios = [];
  const vistos = new Set();
  const padraoCartao = /<a[^>]+href="(https:\/\/[a-z0-9.-]*olx\.com\.br\/[^"]*?-(\d{6,})[^"]*)"[^>]*>([\s\S]{0,1200}?)<\/a>/gi;

  for (const achado of html.matchAll(padraoCartao)) {
    const [, url, id, interior] = achado;
    if (vistos.has(id)) continue;

    const semTags = interior.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    const precoAchado = semTags.match(/R\$\s*([\d.]+(?:,\d{2})?)/);
    if (!precoAchado) continue;
    const preco = precoParaNumero(precoAchado[1]);
    if (!preco) continue;

    const titulo = semTags.slice(0, semTags.indexOf(precoAchado[0])).trim() || semTags.slice(0, 90).trim();
    if (titulo.length < 4) continue;

    vistos.add(id);
    anuncios.push({
      fonte: ID, idExterno: id, titulo, preco, url,
      imagem: null, cidade: null, uf: null, publicadoEm: null,
      armazenamento: extrairArmazenamento(titulo), condicao: extrairCondicao(titulo),
    });
  }
  return anuncios;
}

function extrairDaPagina(html) {
  for (const objeto of extrairJsonEmbutido(html)) {
    const achados = garimparAnuncios(objeto, { fonte: ID, baseUrl: BASE });
    if (achados.length) return { anuncios: achados, via: 'json' };
  }
  const doHtml = extrairDoHtml(html);
  if (doHtml.length) return { anuncios: doHtml, via: 'html' };
  return { anuncios: [], via: 'nenhum' };
}

/** Busca uma pagina, com fallback automatico para navegador real. */
async function carregarPagina(url) {
  let html = null;
  let erroHttp = null;

  try {
    html = await buscar(url);
    if (!pareceDesafio(html)) {
      const resultado = extrairDaPagina(html);
      if (resultado.anuncios.length) return { ...resultado, metodo: 'http' };
    }
  } catch (erro) {
    erroHttp = erro;
  }

  // HTTP barrado ou sem dados: tenta navegador real.
  if (config.coleta.usarNavegador && await playwrightDisponivel()) {
    const htmlRenderizado = await renderizar(url, { esperarSeletor: '[data-ds-component], a[href*="olx.com.br"]' });
    const resultado = extrairDaPagina(htmlRenderizado);
    return { ...resultado, metodo: 'navegador' };
  }

  if (erroHttp) throw erroHttp;
  throw new ErroDeColeta(
    'OLX respondeu mas nenhum anuncio foi reconhecido. Instale o navegador (npm run navegador) para contornar a protecao anti-bot.',
    { bloqueado: pareceDesafio(html) },
  );
}

/** Coleta anuncios da OLX para um termo. */
export async function coletar(termo, opcoes = {}) {
  const maxPaginas = opcoes.maxPaginas ?? config.coleta.maxPaginas;
  const todos = [];
  const diagnostico = { metodo: null, via: null, paginas: 0 };

  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    const url = montarUrl(termo, {
      uf: opcoes.uf ?? config.regiao.uf,
      regiao: opcoes.regiaoSlug ?? config.regiao.slug,
      pagina,
      precoMin: opcoes.precoMin,
      precoMax: opcoes.precoMax,
    });

    const { anuncios, via, metodo } = await carregarPagina(url);
    diagnostico.metodo = metodo;
    diagnostico.via = via;
    diagnostico.paginas = pagina;

    if (!anuncios.length) break;
    todos.push(...anuncios);
    if (anuncios.length < 20) break; // ultima pagina
  }

  return { anuncios: todos, diagnostico };
}
