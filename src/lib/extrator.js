import { precoParaNumero, centavosParaReais, extrairArmazenamento, extrairCondicao } from './texto.js';

/**
 * Extrator resiliente de anuncios a partir de JSON de marketplace.
 *
 * Marketplaces mudam o caminho interno do JSON com frequencia. Em vez de
 * fixar "props.pageProps.ads", varremos a arvore procurando o maior array
 * cujos itens PARECEM anuncio (tem titulo e preco). Isso sobrevive a
 * reorganizacoes de schema.
 */

const CHAVES_TITULO = ['subject', 'title', 'titulo', 'name', 'nome', 'ad_title', 'adtitle', 'headline'];
const CHAVES_PRECO = ['price', 'preco', 'valor', 'pricevalue', 'price_value', 'value', 'amount',
  'price_cents', 'pricecents', 'published_price', 'current_price', 'sale_price'];
const CHAVES_URL = ['url', 'link', 'permalink', 'href', 'canonical_url', 'slug', 'friendly_url'];
const CHAVES_ID = ['listid', 'list_id', 'id', 'adid', 'ad_id', 'productid', 'product_id', 'uuid'];
const CHAVES_IMAGEM = ['thumbnail', 'thumb', 'image', 'images', 'photo', 'photos', 'picture', 'cover'];
const CHAVES_DATA = ['date', 'published_at', 'created_at', 'publishedat', 'createdat', 'listtime'];
const CHAVES_CIDADE = ['municipality', 'city', 'cidade', 'locality', 'town'];
const CHAVES_UF = ['uf', 'state', 'estado', 'region', 'stateacronym'];
const CHAVES_PROFISSIONAL = ['professionalad', 'isprofessional', 'professional', 'isstore',
  'isshop', 'isbusiness', 'iscompany', 'profissional', 'lojista'];
const CHAVES_VENDEDOR = ['seller', 'user', 'advertiser', 'owner', 'vendedor', 'anunciante', 'store', 'shop'];

const CHAVES_LOCAL = ['location', 'locationdetails', 'location_details', 'place', 'address', 'localizacao'];

const chaveNormal = (k) => String(k).toLowerCase().replace(/[^a-z_]/g, '');

/** Busca o primeiro valor util entre varias chaves candidatas (nao recursivo). */
function pegar(objeto, candidatas) {
  if (!objeto || typeof objeto !== 'object') return undefined;
  for (const [chave, valor] of Object.entries(objeto)) {
    if (valor == null || valor === '') continue;
    const k = chaveNormal(chave);
    if (candidatas.includes(k)) return valor;
  }
  return undefined;
}

function pegarChaveOriginal(objeto, candidatas) {
  if (!objeto || typeof objeto !== 'object') return undefined;
  for (const chave of Object.keys(objeto)) {
    if (candidatas.includes(chaveNormal(chave))) return chave;
  }
  return undefined;
}

/** Resolve preco vindo como string, numero, objeto ou lista de propriedades. */
export function resolverPreco(objeto) {
  const chave = pegarChaveOriginal(objeto, CHAVES_PRECO);
  if (chave === undefined) {
    // OLX ja usou properties: [{ name: 'price', value: 'R$ 1.500' }]
    const props = objeto?.properties || objeto?.attributes;
    if (Array.isArray(props)) {
      for (const p of props) {
        const nome = chaveNormal(p?.name || p?.label || p?.key || '');
        if (CHAVES_PRECO.includes(nome)) return precoParaNumero(p?.value ?? p?.valor);
      }
    }
    return null;
  }

  const valor = objeto[chave];
  const ehCentavos = chaveNormal(chave).includes('cent');

  if (typeof valor === 'number') return ehCentavos ? centavosParaReais(valor) : (valor > 0 ? valor : null);
  if (typeof valor === 'string') {
    const n = precoParaNumero(valor);
    return ehCentavos && n ? n / 100 : n;
  }
  if (valor && typeof valor === 'object') {
    // { value: 1500 } | { amount: 150000, currency } | { cents: 150000 }
    for (const sub of ['value', 'amount', 'cents', 'price', 'current']) {
      if (valor[sub] != null) {
        const n = typeof valor[sub] === 'number' ? valor[sub] : precoParaNumero(valor[sub]);
        if (!n) continue;
        return sub === 'cents' ? n / 100 : n;
      }
    }
  }
  return null;
}

/** Heuristica: este objeto parece um anuncio? */
export function pareceAnuncio(objeto) {
  if (!objeto || typeof objeto !== 'object' || Array.isArray(objeto)) return false;
  const titulo = pegar(objeto, CHAVES_TITULO);
  if (typeof titulo !== 'string' || titulo.trim().length < 3) return false;
  return resolverPreco(objeto) != null;
}

function primeiraImagem(valor) {
  if (!valor) return null;
  if (typeof valor === 'string') return valor;
  if (Array.isArray(valor)) return primeiraImagem(valor[0]);
  if (typeof valor === 'object') {
    for (const k of ['original', 'url', 'src', 'medium', 'large', 'thumbnail', 'default']) {
      if (typeof valor[k] === 'string') return valor[k];
    }
  }
  return null;
}

function extrairLocal(objeto) {
  let cidade = pegar(objeto, CHAVES_CIDADE);
  let uf = pegar(objeto, CHAVES_UF);

  const bloco = pegar(objeto, CHAVES_LOCAL);
  if (typeof bloco === 'string') {
    // "Sao Paulo, SP" | "Campinas - SP"
    const partes = bloco.split(/[,-]/).map((s) => s.trim()).filter(Boolean);
    if (!cidade && partes[0]) cidade = partes[0];
    if (!uf && partes[1] && partes[1].length <= 3) uf = partes[1];
  } else if (bloco && typeof bloco === 'object') {
    cidade = cidade || pegar(bloco, CHAVES_CIDADE);
    uf = uf || pegar(bloco, CHAVES_UF);
  }

  const texto = (v) => (typeof v === 'string' ? v : (v && typeof v === 'object' ? (v.name || v.label || null) : null));
  return { cidade: texto(cidade), uf: texto(uf) };
}

/**
 * Descobre se o anuncio e de loja/empresa em vez de pessoa fisica.
 * A OLX marca isso no proprio anuncio (professionalAd); quando o campo nao
 * vem, devolvemos null e quem decide e o filtro, pelo texto.
 */
function ehProfissional(objeto) {
  const direto = pegar(objeto, CHAVES_PROFISSIONAL);
  if (typeof direto === 'boolean') return direto;
  if (typeof direto === 'string') return ['true', '1', 'sim', 'yes'].includes(direto.toLowerCase());

  const vendedor = pegar(objeto, CHAVES_VENDEDOR);
  if (vendedor && typeof vendedor === 'object') {
    const aninhado = pegar(vendedor, CHAVES_PROFISSIONAL);
    if (typeof aninhado === 'boolean') return aninhado;
    const tipo = String(vendedor.type || vendedor.tipo || vendedor.kind || '').toLowerCase();
    if (tipo) return /(profession|store|shop|business|company|loja|empresa|pj)/.test(tipo);
  }
  return null;
}

function nomeDoVendedor(objeto) {
  const vendedor = pegar(objeto, CHAVES_VENDEDOR);
  if (typeof vendedor === 'string') return vendedor;
  if (vendedor && typeof vendedor === 'object') {
    const nome = vendedor.name || vendedor.nome || vendedor.nickname || vendedor.displayName;
    if (typeof nome === 'string') return nome;
  }
  return null;
}

function resolverUrl(objeto, baseUrl) {
  const bruto = pegar(objeto, CHAVES_URL);
  const valor = typeof bruto === 'string' ? bruto : (bruto?.url || bruto?.href || null);
  if (!valor) return null;
  try {
    return new URL(valor, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Converte um objeto bruto no formato padrao do sistema. */
export function normalizarAnuncio(objeto, { fonte, baseUrl }) {
  const titulo = String(pegar(objeto, CHAVES_TITULO) ?? '').trim();
  const preco = resolverPreco(objeto);
  if (!titulo || preco == null) return null;

  const { cidade, uf } = extrairLocal(objeto);
  const idBruto = pegar(objeto, CHAVES_ID);

  return {
    fonte,
    idExterno: idBruto != null ? String(idBruto) : null,
    titulo,
    preco,
    url: resolverUrl(objeto, baseUrl),
    imagem: primeiraImagem(pegar(objeto, CHAVES_IMAGEM)),
    cidade: cidade || null,
    uf: uf || null,
    publicadoEm: pegar(objeto, CHAVES_DATA) ?? null,
    armazenamento: extrairArmazenamento(titulo),
    condicao: extrairCondicao(titulo),
    profissional: ehProfissional(objeto),
    vendedor: nomeDoVendedor(objeto),
  };
}

/**
 * Varre a arvore JSON e devolve o maior conjunto de objetos que parecem anuncio.
 * Limita profundidade e marca visitados para nao entrar em ciclo.
 */
export function garimparAnuncios(raiz, { fonte, baseUrl, profundidadeMax = 14 } = {}) {
  const estritos = [];
  const tolerantes = [];
  const visitados = new WeakSet();

  function visitar(no, profundidade) {
    if (!no || typeof no !== 'object' || profundidade > profundidadeMax) return;
    if (visitados.has(no)) return;
    visitados.add(no);

    if (Array.isArray(no)) {
      const candidatos = no.filter(pareceAnuncio);
      if (candidatos.length) {
        // Passe estrito: lista com varios itens e maioria casando.
        if (candidatos.length >= 2 && candidatos.length >= no.length * 0.5) {
          estritos.push(candidatos);
        } else if (candidatos.length === no.length) {
          // Passe tolerante: array pequeno mas 100% de anuncios.
          // Cobre busca com resultado unico, sem abrir margem para ruido.
          tolerantes.push(candidatos);
        }
      }
      for (const item of no) visitar(item, profundidade + 1);
      return;
    }

    for (const valor of Object.values(no)) visitar(valor, profundidade + 1);
  }

  visitar(raiz, 0);
  const encontrados = estritos.length ? estritos : tolerantes;
  if (!encontrados.length) return [];

  // Junta todos os grupos encontrados e deduplica por identidade de objeto.
  const vistos = new Set();
  const saida = [];
  for (const grupo of encontrados.sort((a, b) => b.length - a.length)) {
    for (const bruto of grupo) {
      const anuncio = normalizarAnuncio(bruto, { fonte, baseUrl });
      if (!anuncio) continue;
      const chave = `${anuncio.idExterno ?? ''}|${anuncio.titulo}|${anuncio.preco}`;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      saida.push(anuncio);
    }
  }
  return saida;
}

/** Extrai o JSON embutido em <script id="__NEXT_DATA__"> e similares. */
export function extrairJsonEmbutido(html) {
  const blocos = [];
  const padroes = [
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
    /<script[^>]+id=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
    /<script[^>]*>\s*window\.__INITIAL_STATE__\s*=\s*([\s\S]*?);?\s*<\/script>/i,
    /<script[^>]*>\s*window\.__NUXT__\s*=\s*([\s\S]*?);?\s*<\/script>/i,
    /<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi,
  ];

  for (const padrao of padroes) {
    if (padrao.global) {
      for (const achado of html.matchAll(padrao)) blocos.push(achado[1]);
    } else {
      const achado = html.match(padrao);
      if (achado) blocos.push(achado[1]);
    }
  }

  const objetos = [];
  for (const bloco of blocos) {
    const texto = bloco.trim().replace(/;$/, '');
    if (!texto.startsWith('{') && !texto.startsWith('[')) continue;
    try {
      objetos.push(JSON.parse(texto));
    } catch { /* bloco nao e JSON puro - ignora */ }
  }
  return objetos;
}
