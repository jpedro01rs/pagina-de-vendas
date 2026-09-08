import config from '../config.js';
import { buscar, pareceDesafio, ErroDeColeta } from '../lib/http.js';
import { renderizar, playwrightDisponivel } from '../lib/navegador.js';
import { extrairJsonEmbutido, garimparAnuncios } from '../lib/extrator.js';
import { precoParaNumero, extrairArmazenamento, extrairCondicao } from '../lib/texto.js';
import { caminhoDeCategoria, caminhoDaCategoriaPai, sufixoDeRegiao } from './olx-taxonomia.js';
import { extrairCartoesDaPagina, PADRAO_ID } from '../lib/extrator-dom.js';

export const ID = 'olx';
export const NOME = 'OLX';
const BASE = 'https://www.olx.com.br';

/**
 * Monta uma URL da OLX.
 *
 * Preferimos o caminho de CATEGORIA a busca por texto. Em
 * /celulares/apple/iphone-12 quem separa o modelo e a propria OLX, entao nao
 * chega capinha, tela nem iPhone 12 Pro. A busca por texto fica como reserva.
 */
export function montarUrl({ caminho = null, termo = null, uf, regiao, pagina = 1, precoMin, precoMax } = {}) {
  const base = caminho || '/brasil';
  const url = new URL(base + (caminho ? sufixoDeRegiao({ uf, regiao }) : ''), BASE);

  // Sem caminho de categoria, a regiao vai no proprio caminho da busca livre.
  if (!caminho && uf) {
    url.pathname = regiao ? `/estado-${uf}/${regiao}` : `/estado-${uf}`;
  }

  if (termo) url.searchParams.set('q', termo);
  if (pagina > 1) url.searchParams.set('o', String(pagina));
  if (precoMin) url.searchParams.set('ps', String(precoMin));
  if (precoMax) url.searchParams.set('pe', String(precoMax));
  return url.toString();
}

/**
 * Cascata de tentativas, da mais precisa para a mais ampla.
 * Se a OLX renomear um slug de modelo, a coleta ainda funciona pelos degraus
 * seguintes em vez de simplesmente devolver zero anuncio.
 */
export function planoDeBusca(produto, termo, opcoes) {
  const comum = {
    uf: opcoes.uf, regiao: opcoes.regiaoSlug,
    precoMin: opcoes.precoMin, precoMax: opcoes.precoMax,
  };
  const tentativas = [];

  const categoria = caminhoDeCategoria(produto);
  if (categoria) tentativas.push({ rotulo: 'categoria', ...comum, caminho: categoria });

  const pai = caminhoDaCategoriaPai(produto);
  if (pai && pai !== categoria) tentativas.push({ rotulo: 'categoria+busca', ...comum, caminho: pai, termo });

  tentativas.push({ rotulo: 'busca', ...comum, termo });
  return tentativas;
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

/** Converte o que veio do DOM no formato padrao do sistema. */
function converterDoNavegador(itens) {
  const anuncios = [];
  for (const item of itens || []) {
    const preco = precoParaNumero(item.precoTexto);
    if (!preco) continue;

    // A cidade costuma vir no fim do texto do cartao, apos o preco.
    const depois = item.textoCartao.slice(item.textoCartao.indexOf(item.precoTexto) + item.precoTexto.length);
    const local = depois.match(/([A-ZÀ-Ú][\wÀ-ú'.\- ]{2,40}),?\s*-?\s*([A-Z]{2})\b/);

    anuncios.push({
      fonte: ID,
      idExterno: item.idExterno,
      titulo: item.titulo,
      preco,
      url: item.url,
      imagem: null,
      cidade: local ? local[1].trim() : null,
      uf: local ? local[2] : null,
      publicadoEm: null,
      armazenamento: extrairArmazenamento(item.titulo),
      condicao: extrairCondicao(item.titulo),
      // Sem o JSON da pagina nao ha marcador oficial de loja: fica para o
      // filtro decidir pelo texto do anuncio.
      profissional: null,
      vendedor: null,
      textoCartao: item.textoCartao,
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

  // HTTP barrado (a OLX responde 403 a requisicao simples) ou sem dados:
  // abre a pagina num navegador real e le o DOM ja montado.
  if (config.coleta.usarNavegador && await playwrightDisponivel()) {
    const { html: htmlRenderizado, dados } = await renderizar(url, {
      esperarSeletor: 'a[href*="olx.com.br"]',
      esperaExtraMs: 2500,
      rolar: true,
      extrair: extrairCartoesDaPagina,
      extrairArg: { padraoId: PADRAO_ID.olx },
    });

    const doDom = converterDoNavegador(dados);
    if (doDom.length) return { anuncios: doDom, via: 'dom', metodo: 'navegador' };

    // Ultimo recurso: os extratores antigos, sobre o HTML renderizado.
    const resultado = extrairDaPagina(htmlRenderizado);
    return { ...resultado, metodo: 'navegador' };
  }

  if (erroHttp) throw erroHttp;
  throw new ErroDeColeta(
    'OLX respondeu mas nenhum anuncio foi reconhecido. Instale o navegador (npm run navegador) para contornar a protecao anti-bot.',
    { bloqueado: pareceDesafio(html) },
  );
}

/** Coleta anuncios da OLX. Usa categoria quando o produto tem uma. */
export async function coletar(termo, opcoes = {}) {
  const maxPaginas = opcoes.maxPaginas ?? config.coleta.maxPaginas;
  const alvo = {
    uf: opcoes.uf ?? config.regiao.uf,
    regiaoSlug: opcoes.regiaoSlug ?? config.regiao.slug,
    precoMin: opcoes.precoMin,
    precoMax: opcoes.precoMax,
  };

  const tentativas = opcoes.produto
    ? planoDeBusca(opcoes.produto, termo, alvo)
    : [{ rotulo: 'busca', termo, uf: alvo.uf, regiao: alvo.regiaoSlug, precoMin: alvo.precoMin, precoMax: alvo.precoMax }];

  const diagnostico = { metodo: null, via: null, paginas: 0, estrategia: null, tentadas: [] };

  for (const tentativa of tentativas) {
    const todos = [];

    for (let pagina = 1; pagina <= maxPaginas; pagina++) {
      const url = montarUrl({ ...tentativa, pagina });
      const { anuncios, via, metodo } = await carregarPagina(url);

      diagnostico.metodo = metodo;
      diagnostico.via = via;
      diagnostico.paginas = pagina;

      if (!anuncios.length) break;
      todos.push(...anuncios);
      if (anuncios.length < 20) break; // ultima pagina
    }

    diagnostico.tentadas.push({ estrategia: tentativa.rotulo, encontrados: todos.length });

    if (todos.length) {
      diagnostico.estrategia = tentativa.rotulo;
      return { anuncios: todos, diagnostico };
    }
  }

  return { anuncios: [], diagnostico };
}
