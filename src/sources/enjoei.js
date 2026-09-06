import config from '../config.js';
import { buscar, ErroDeColeta } from '../lib/http.js';
import { renderizar, playwrightDisponivel } from '../lib/navegador.js';
import { extrairJsonEmbutido, garimparAnuncios } from '../lib/extrator.js';

export const ID = 'enjoei';
export const NOME = 'Enjoei';
const BASE = 'https://www.enjoei.com.br';

/**
 * O Enjoei ja moveu a busca de endpoint mais de uma vez. Tentamos os
 * candidatos conhecidos em ordem e ficamos com o primeiro que responder.
 */
const ENDPOINTS = [
  (termo, pagina) => `https://enjusearch.enjoei.com.br/api/v6/search/products?query=${encodeURIComponent(termo)}&page=${pagina}`,
  (termo, pagina) => `https://enjusearch.enjoei.com.br/api/v6/search?query=${encodeURIComponent(termo)}&page=${pagina}`,
  (termo, pagina) => `https://api.enjoei.com.br/v6/search/products?query=${encodeURIComponent(termo)}&page=${pagina}`,
];

export function montarUrlSite(termo, pagina = 1) {
  const url = new URL('/busca', BASE);
  url.searchParams.set('q', termo);
  if (pagina > 1) url.searchParams.set('page', String(pagina));
  return url.toString();
}

async function tentarApi(termo, pagina) {
  const falhas = [];
  for (const montar of ENDPOINTS) {
    const url = montar(termo, pagina);
    try {
      const dados = await buscar(url, {
        json: true,
        cabecalhos: { Referer: BASE + '/', Origin: BASE },
      });
      const anuncios = garimparAnuncios(dados, { fonte: ID, baseUrl: BASE });
      if (anuncios.length) return { anuncios, via: 'api', endpoint: url };
    } catch (erro) {
      falhas.push(`${new URL(url).host}: ${erro.message}`);
    }
  }
  return { anuncios: [], via: null, falhas };
}

async function tentarSite(termo, pagina) {
  const url = montarUrlSite(termo, pagina);
  let html;
  try {
    html = await buscar(url);
  } catch (erro) {
    if (config.coleta.usarNavegador && await playwrightDisponivel()) {
      html = await renderizar(url, { esperarSeletor: 'a[href*="/p/"]' });
    } else {
      throw erro;
    }
  }
  for (const objeto of extrairJsonEmbutido(html)) {
    const anuncios = garimparAnuncios(objeto, { fonte: ID, baseUrl: BASE });
    if (anuncios.length) return { anuncios, via: 'site' };
  }
  return { anuncios: [], via: null };
}

/** Coleta anuncios do Enjoei para um termo. */
export async function coletar(termo, opcoes = {}) {
  const maxPaginas = opcoes.maxPaginas ?? config.coleta.maxPaginas;
  const todos = [];
  const diagnostico = { via: null, paginas: 0, falhas: [] };

  for (let pagina = 1; pagina <= maxPaginas; pagina++) {
    let resultado = await tentarApi(termo, pagina);
    if (!resultado.anuncios.length) {
      diagnostico.falhas.push(...(resultado.falhas || []));
      resultado = await tentarSite(termo, pagina);
    }

    diagnostico.via = resultado.via || diagnostico.via;
    diagnostico.paginas = pagina;

    if (!resultado.anuncios.length) break;
    todos.push(...resultado.anuncios);
    if (resultado.anuncios.length < 20) break;
  }

  if (!todos.length && diagnostico.falhas.length) {
    throw new ErroDeColeta(`Enjoei nao respondeu: ${diagnostico.falhas.slice(0, 3).join(' | ')}`);
  }
  // O Enjoei e nacional: nao ha filtro de regiao confiavel na busca.
  return { anuncios: todos.map((a) => ({ ...a, nacional: true })), diagnostico };
}
