import config from '../config.js';
import { buscar, ErroDeColeta } from '../lib/http.js';
import { renderizar, playwrightDisponivel } from '../lib/navegador.js';
import { extrairJsonEmbutido, garimparAnuncios } from '../lib/extrator.js';

export const ID = 'enjoei';
export const NOME = 'Enjoei';
const BASE = 'https://www.enjoei.com.br';

/**
 * URL de busca do Enjoei, confirmada no proprio site:
 *
 *   https://www.enjoei.com.br/iphone-usado/s?q=iphone+usado
 *
 * O padrao e /{slug-do-termo}/s?q={termo}. Versoes anteriores deste arquivo
 * chutavam endpoints de API que respondiam 404 - a busca no site e o caminho
 * que existe de fato.
 */
export function montarUrlSite(termo, pagina = 1) {
  const slug = String(termo).toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'busca';

  const url = new URL(`/${slug}/s`, BASE);
  url.searchParams.set('q', termo);
  if (pagina > 1) url.searchParams.set('page', String(pagina));
  return url.toString();
}

/** Endpoints de API que o site ja usou. Ficam como ultima tentativa. */
const ENDPOINTS = [
  (termo, pagina) => `https://enjusearch.enjoei.com.br/api/v6/search/products?query=${encodeURIComponent(termo)}&page=${pagina}`,
  (termo, pagina) => `https://api.enjoei.com.br/v6/search/products?query=${encodeURIComponent(termo)}&page=${pagina}`,
];

function garimparEm(html) {
  for (const objeto of extrairJsonEmbutido(html)) {
    const anuncios = garimparAnuncios(objeto, { fonte: ID, baseUrl: BASE });
    if (anuncios.length) return anuncios;
  }
  return [];
}

/**
 * O Enjoei e uma aplicacao JavaScript: a resposta HTTP costuma vir como uma
 * casca vazia, com os produtos chegando depois. Por isso, quando o HTML cru
 * nao traz anuncio, renderizamos a pagina num navegador de verdade - e nao
 * apenas quando a requisicao falha.
 */
async function tentarSite(termo, pagina) {
  const url = montarUrlSite(termo, pagina);

  let html = null;
  try {
    html = await buscar(url);
    const anuncios = garimparEm(html);
    if (anuncios.length) return { anuncios, via: 'site' };
  } catch { /* segue para o navegador */ }

  if (config.coleta.usarNavegador && await playwrightDisponivel()) {
    const renderizado = await renderizar(url, { esperarSeletor: 'a[href*="/p/"]', esperaExtraMs: 2000 });
    const anuncios = garimparEm(renderizado);
    if (anuncios.length) return { anuncios, via: 'site-navegador' };
  }

  return { anuncios: [], via: null };
}

async function tentarApi(termo, pagina) {
  const falhas = [];
  for (const montar of ENDPOINTS) {
    const url = montar(termo, pagina);
    try {
      const dados = await buscar(url, { json: true, cabecalhos: { Referer: BASE + '/', Origin: BASE } });
      const anuncios = garimparAnuncios(dados, { fonte: ID, baseUrl: BASE });
      if (anuncios.length) return { anuncios, via: 'api', falhas };
    } catch (erro) {
      falhas.push(`${new URL(url).host}: ${erro.message}`);
    }
  }
  return { anuncios: [], via: null, falhas };
}

/** Coleta anuncios do Enjoei para um termo. */
export async function coletar(termo, opcoes = {}) {
  const maxPaginas = opcoes.maxPaginas ?? config.coleta.maxPaginas;
  const todos = [];
  const diagnostico = { via: null, paginas: 0, falhas: [] };

  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    // O site vem primeiro: e o caminho que existe. A API fica de reserva.
    let resultado = await tentarSite(termo, pagina);

    if (!resultado.anuncios.length) {
      const viaApi = await tentarApi(termo, pagina);
      diagnostico.falhas.push(...(viaApi.falhas || []));
      if (viaApi.anuncios.length) resultado = viaApi;
    }

    diagnostico.via = resultado.via || diagnostico.via;
    diagnostico.paginas = pagina;

    if (!resultado.anuncios.length) break;
    todos.push(...resultado.anuncios);
    if (resultado.anuncios.length < 20) break;
  }

  if (!todos.length) {
    throw new ErroDeColeta(
      `Enjoei nao devolveu anuncios${diagnostico.falhas.length ? `: ${diagnostico.falhas.slice(0, 2).join(' | ')}` : ' (pagina carregou vazia)'}`,
    );
  }

  // O Enjoei e nacional: nao ha filtro de regiao confiavel na busca.
  return { anuncios: todos.map((a) => ({ ...a, nacional: true })), diagnostico };
}
