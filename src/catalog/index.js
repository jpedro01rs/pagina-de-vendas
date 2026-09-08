/**
 * Catalogo de produtos monitorados.
 *
 * Os iPhones sao gerados a partir de uma tabela compacta para evitar erro de
 * digitacao em ~40 variantes. Consoles e o resto sao declarados explicitamente.
 *
 * Campos de cada produto:
 *  - id, nome, categoria, marca
 *  - consultas: termos enviados aos marketplaces
 *  - exigir:  tokens que PRECISAM aparecer no titulo (alem do padrao)
 *  - proibir: tokens que ELIMINAM o anuncio (desambiguacao de variante)
 *  - padrao:  RegExp que identifica o modelo no titulo
 *  - faixa:   [min, max] em R$ - guarda de sanidade do mercado USADO.
 *             NAO e avaliacao de preco: serve so para descartar peca solta,
 *             golpe e anuncio de outro produto. O preco real vem da coleta.
 */

const VARIANTES_IPHONE = ['pro', 'max', 'mini', 'plus', 'air'];

// [numero, faixa base [min,max] do modelo simples em R$ usado]
const LINHA_IPHONE = [
  ['7',  [250, 1100],  ['', 'plus']],
  ['8',  [350, 1500],  ['', 'plus']],
  ['x',  [600, 2200],  ['']],
  ['xr', [700, 2500],  ['']],
  ['xs', [700, 2600],  ['', 'max']],
  ['11', [900, 3200],  ['', 'pro', 'pro max']],
  ['12', [1200, 4000], ['', 'mini', 'pro', 'pro max']],
  ['13', [1600, 5000], ['', 'mini', 'pro', 'pro max']],
  ['14', [2000, 6200], ['', 'plus', 'pro', 'pro max']],
  ['15', [2800, 7800], ['', 'plus', 'pro', 'pro max']],
  ['16', [3500, 9500], ['', 'plus', 'pro', 'pro max']],
  ['17', [4500, 13000], ['', 'air', 'pro', 'pro max']],
];

const MULTIPLICADOR = { '': 1, mini: 0.85, plus: 1.2, air: 1.25, pro: 1.4, 'pro max': 1.7 };

function slug(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function construirIphones() {
  const produtos = [];
  for (const [numero, faixaBase, variantes] of LINHA_IPHONE) {
    for (const variante of variantes) {
      const partes = variante ? variante.split(' ') : [];
      const nome = `iPhone ${numero.toUpperCase()}${variante ? ' ' + variante.replace(/\b\w/g, (c) => c.toUpperCase()) : ''}`;
      const mult = MULTIPLICADOR[variante] ?? 1;
      produtos.push({
        id: slug(nome),
        nome,
        categoria: 'Celulares',
        marca: 'Apple',
        consultas: [nome.toLowerCase()],
        exigir: partes,
        proibir: VARIANTES_IPHONE.filter((v) => !partes.includes(v)),
        exigirPadrao: [],
        proibirPadrao: [],
        padrao: `\\biphone\\s*${numero}\\b`,
        faixa: [Math.round(faixaBase[0] * mult), Math.round(faixaBase[1] * mult)],
      });
    }
  }
  // iPhone SE: numeracao propria, tratado a parte.
  produtos.push({
    id: 'iphone-se-2020', nome: 'iPhone SE 2020', categoria: 'Celulares', marca: 'Apple',
    consultas: ['iphone se 2020'], exigir: ['se'], proibir: [], exigirPadrao: [], proibirPadrao: ['\\b2022\\b'],
    padrao: '\\biphone\\s*se\\b', faixa: [400, 1500],
  });
  produtos.push({
    id: 'iphone-se-2022', nome: 'iPhone SE 2022', categoria: 'Celulares', marca: 'Apple',
    consultas: ['iphone se 2022'], exigir: ['se'], proibir: [], exigirPadrao: [], proibirPadrao: ['\\b2020\\b'],
    padrao: '\\biphone\\s*se\\b', faixa: [700, 2200],
  });
  return produtos;
}

const CONSOLES = [
  { nome: 'PlayStation 2', consultas: ['playstation 2', 'ps2'], padrao: '\\b(ps ?2|playstation ?2)\\b',
    proibirPadrao: ['\\b(ps ?[345]|playstation ?[345])\\b'], faixa: [120, 900] },
  { nome: 'PlayStation 3', consultas: ['playstation 3', 'ps3'], padrao: '\\b(ps ?3|playstation ?3)\\b',
    proibirPadrao: ['\\b(ps ?[45]|playstation ?[45])\\b'], faixa: [300, 1500] },
  { nome: 'PlayStation 4', consultas: ['playstation 4', 'ps4'], padrao: '\\b(ps ?4|playstation ?4)\\b',
    proibir: ['pro'], proibirPadrao: ['\\b(ps ?5|playstation ?5)\\b'], faixa: [600, 2400] },
  { nome: 'PlayStation 4 Pro', consultas: ['playstation 4 pro', 'ps4 pro'], padrao: '\\b(ps ?4|playstation ?4)\\b',
    exigir: ['pro'], proibirPadrao: ['\\b(ps ?5|playstation ?5)\\b'], faixa: [900, 3000] },
  { nome: 'PlayStation 5', consultas: ['playstation 5', 'ps5'], padrao: '\\b(ps ?5|playstation ?5)\\b',
    proibir: ['slim', 'pro'], faixa: [1800, 5200] },
  { nome: 'PlayStation 5 Slim', consultas: ['playstation 5 slim', 'ps5 slim'], padrao: '\\b(ps ?5|playstation ?5)\\b',
    exigir: ['slim'], proibir: ['pro'], faixa: [2000, 5500] },
  { nome: 'PlayStation 5 Pro', consultas: ['playstation 5 pro', 'ps5 pro'], padrao: '\\b(ps ?5|playstation ?5)\\b',
    exigir: ['pro'], faixa: [3000, 8000] },
  { nome: 'Xbox 360', consultas: ['xbox 360'], padrao: '\\bxbox\\s*360\\b',
    proibirPadrao: ['\\bxbox\\s*one\\b', '\\bseries\\b'], faixa: [200, 1200] },
  { nome: 'Xbox One', consultas: ['xbox one'], padrao: '\\bxbox\\s*one\\b',
    proibirPadrao: ['\\bone\\s*[sx]\\b', '\\bseries\\b'], faixa: [500, 1800] },
  { nome: 'Xbox One S', consultas: ['xbox one s'], padrao: '\\bxbox\\s*one\\b',
    exigirPadrao: ['\\bone\\s*s\\b'], proibirPadrao: ['\\bone\\s*x\\b', '\\bseries\\b'], faixa: [600, 2000] },
  { nome: 'Xbox One X', consultas: ['xbox one x'], padrao: '\\bxbox\\s*one\\b',
    exigirPadrao: ['\\bone\\s*x\\b'], proibirPadrao: ['\\bone\\s*s\\b', '\\bseries\\b'], faixa: [800, 2600] },
  { nome: 'Xbox Series S', consultas: ['xbox series s'], padrao: '\\bxbox\\s*series\\b',
    exigirPadrao: ['\\bseries\\s*s\\b'], proibirPadrao: ['\\bseries\\s*x\\b'], faixa: [900, 2800] },
  { nome: 'Xbox Series X', consultas: ['xbox series x'], padrao: '\\bxbox\\s*series\\b',
    exigirPadrao: ['\\bseries\\s*x\\b'], proibirPadrao: ['\\bseries\\s*s\\b'], faixa: [1800, 4800] },
  { nome: 'Nintendo Switch', consultas: ['nintendo switch'], padrao: '\\bswitch\\b',
    proibir: ['lite', 'oled'], proibirPadrao: ['\\bswitch\\s*2\\b'], faixa: [900, 2600] },
  { nome: 'Nintendo Switch Lite', consultas: ['nintendo switch lite'], padrao: '\\bswitch\\b',
    exigir: ['lite'], proibirPadrao: ['\\bswitch\\s*2\\b'], faixa: [700, 2000] },
  { nome: 'Nintendo Switch OLED', consultas: ['nintendo switch oled'], padrao: '\\bswitch\\b',
    exigir: ['oled'], proibirPadrao: ['\\bswitch\\s*2\\b'], faixa: [1400, 3200] },
  { nome: 'Nintendo Switch 2', consultas: ['nintendo switch 2'], padrao: '\\bswitch\\s*2\\b',
    proibir: ['lite', 'oled'], faixa: [2200, 5500] },
  { nome: 'Nintendo Wii', consultas: ['nintendo wii'], padrao: '\\bwii\\b',
    proibirPadrao: ['\\bwii\\s*u\\b'], faixa: [150, 900] },
  { nome: 'Nintendo 3DS', consultas: ['nintendo 3ds'], padrao: '\\b3ds\\b', faixa: [300, 1600] },
  { nome: 'Steam Deck', consultas: ['steam deck'], padrao: '\\bsteam\\s*deck\\b', faixa: [1500, 5000] },
];

const OUTROS = [
  { nome: 'iPad 9a Geracao', categoria: 'Tablets', marca: 'Apple', consultas: ['ipad 9 geracao'], padrao: '\\bipad\\b', exigirPadrao: ['\\b(?:ipad\\s*9|9\\s*[a\u00aa]?\\s*ger)'], proibirPadrao: ['\\b(?:ipad\\s*10|10\\s*[a\u00aa]?\\s*ger)', '\\bair\\b', '\\bpro\\b', '\\bmini\\b'], faixa: [900, 2800] },
  { nome: 'iPad 10a Geracao', categoria: 'Tablets', marca: 'Apple', consultas: ['ipad 10 geracao'], padrao: '\\bipad\\b', exigirPadrao: ['\\b(?:ipad\\s*10|10\\s*[a\u00aa]?\\s*ger)'], proibirPadrao: ['\\b(?:ipad\\s*9|9\\s*[a\u00aa]?\\s*ger)', '\\bair\\b', '\\bpro\\b', '\\bmini\\b'], faixa: [1200, 3500] },
  { nome: 'iPad Air', categoria: 'Tablets', marca: 'Apple', consultas: ['ipad air'], padrao: '\\bipad\\s*air\\b', faixa: [1500, 6000] },
  { nome: 'MacBook Air M1', categoria: 'Notebooks', marca: 'Apple', consultas: ['macbook air m1'], padrao: '\\bmacbook\\s*air\\b', exigir: ['m1'], faixa: [2500, 6500] },
  { nome: 'MacBook Air M2', categoria: 'Notebooks', marca: 'Apple', consultas: ['macbook air m2'], padrao: '\\bmacbook\\s*air\\b', exigir: ['m2'], faixa: [3500, 9000] },
  { nome: 'AirPods Pro 2', categoria: 'Audio', marca: 'Apple', consultas: ['airpods pro 2'], padrao: '\\bairpods\\b', exigir: ['pro'],
    exigirPadrao: ['\\b(?:pro\\s*2|2\\s*[a\u00aa]?\\s*ger)'], proibirPadrao: ['\\b(?:pro\\s*1|1\\s*[a\u00aa]?\\s*ger|a2084)'], faixa: [500, 2200] },
  { nome: 'Apple Watch SE 2', categoria: 'Wearables', marca: 'Apple', consultas: ['apple watch se 2'], padrao: '\\bapple\\s*watch\\b', exigir: ['se'],
    exigirPadrao: ['\\b(?:se\\s*2|2\\s*[a\u00aa]?\\s*ger)'], proibirPadrao: ['\\b(?:se\\s*1|1\\s*[a\u00aa]?\\s*ger)'], faixa: [600, 2500] },
  { nome: 'Samsung Galaxy S22', categoria: 'Celulares', marca: 'Samsung', consultas: ['galaxy s22'], padrao: '\\bs22\\b', proibir: ['ultra', 'plus'], proibirPadrao: ['\\bs22\\s*\\+'], faixa: [900, 3000] },
  { nome: 'Samsung Galaxy S23', categoria: 'Celulares', marca: 'Samsung', consultas: ['galaxy s23'], padrao: '\\bs23\\b', proibir: ['ultra', 'plus'], proibirPadrao: ['\\bs23\\s*\\+'], faixa: [1300, 4200] },
  { nome: 'Samsung Galaxy S24', categoria: 'Celulares', marca: 'Samsung', consultas: ['galaxy s24'], padrao: '\\bs24\\b', proibir: ['ultra', 'plus'], proibirPadrao: ['\\bs24\\s*\\+'], faixa: [1800, 5500] },
  { nome: 'Samsung Galaxy S24 Ultra', categoria: 'Celulares', marca: 'Samsung', consultas: ['galaxy s24 ultra'], padrao: '\\bs24\\b', exigir: ['ultra'], faixa: [3000, 8500] },
  { nome: 'Xiaomi Redmi Note 13', categoria: 'Celulares', marca: 'Xiaomi', consultas: ['redmi note 13'], padrao: '\\bnote\\s*13\\b', proibir: ['pro'], faixa: [500, 1800] },
  { nome: 'Xiaomi Redmi Note 14', categoria: 'Celulares', marca: 'Xiaomi', consultas: ['redmi note 14'], padrao: '\\bnote\\s*14\\b', proibir: ['pro'], faixa: [700, 2200] },
];

function normalizarEntrada(entrada, categoriaPadrao, marcaPadrao) {
  return {
    id: slug(entrada.nome),
    nome: entrada.nome,
    categoria: entrada.categoria || categoriaPadrao,
    marca: entrada.marca || marcaPadrao,
    consultas: entrada.consultas || [entrada.nome.toLowerCase()],
    exigir: entrada.exigir || [],
    proibir: entrada.proibir || [],
    exigirPadrao: entrada.exigirPadrao || [],
    proibirPadrao: entrada.proibirPadrao || [],
    padrao: entrada.padrao,
    faixa: entrada.faixa,
  };
}

export const CATALOGO = [
  ...construirIphones(),
  ...CONSOLES.map((c) => normalizarEntrada(c, 'Videogames', c.marca || 'Diversos')),
  ...OUTROS.map((o) => normalizarEntrada(o, 'Diversos', 'Diversos')),
];

export const PRODUTOS_POR_ID = new Map(CATALOGO.map((p) => [p.id, p]));

export function buscarProduto(id) {
  return PRODUTOS_POR_ID.get(id) || null;
}

export function categorias() {
  return [...new Set(CATALOGO.map((p) => p.categoria))].sort();
}

/** Produto sintetico para uma busca livre digitada pelo usuario. */
export function produtoAvulso(termo) {
  const limpo = String(termo).trim();
  return {
    id: `busca-${slug(limpo)}`,
    nome: limpo,
    categoria: 'Busca livre',
    marca: '-',
    consultas: [limpo],
    exigir: [],
    proibir: [],
    exigirPadrao: [],
    proibirPadrao: [],
    padrao: null,
    faixa: null,
    avulso: true,
  };
}
