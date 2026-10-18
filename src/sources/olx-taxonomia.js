/**
 * Taxonomia de categorias da OLX.
 *
 * Buscar por texto ("?q=iphone 12") traz capinha, peca e o modelo errado.
 * A propria OLX ja separa isso em caminhos de categoria:
 *
 *   /celulares/apple/iphone-13/128gb/usado-excelente/estado-sp/sao-paulo-e-regiao
 *   /games/consoles-de-video-game/playstation-5/estado-rj/rio-de-janeiro-e-regiao
 *
 * Usar o caminho da categoria em vez da busca livre melhora muito a qualidade:
 * o filtro de modelo e de tipo de produto passa a ser feito pela OLX, na origem.
 *
 * Os caminhos abaixo seguem a estrutura observada no site. Quando um slug nao
 * existir mais, a coleta cai para busca dentro da categoria e depois para busca
 * global - ver a cascata em olx.js.
 */

const MARCA_POR_CATEGORIA = {
  Apple: 'apple',
  Samsung: 'samsung',
  Xiaomi: 'xiaomi',
  Motorola: 'motorola',
};

/** Consoles: id do catalogo -> slug da OLX. */
const CONSOLES = {
  'playstation-2': 'playstation-2',
  'playstation-3': 'playstation-3',
  'playstation-4': 'playstation-4',
  'playstation-4-pro': 'playstation-4',
  'playstation-5': 'playstation-5',
  'playstation-5-slim': 'playstation-5',
  'playstation-5-pro': 'playstation-5',
  'xbox-360': 'xbox-360',
  'xbox-one': 'xbox-one',
  'xbox-one-s': 'xbox-one',
  'xbox-one-x': 'xbox-one',
  'xbox-series-s': 'xbox-series-s',
  'xbox-series-x': 'xbox-series-x',
  'nintendo-switch': 'nintendo-switch',
  'nintendo-switch-lite': 'nintendo-switch',
  'nintendo-switch-oled': 'nintendo-switch',
  'nintendo-switch-2': 'nintendo-switch',
  'nintendo-wii': 'nintendo-wii',
  'nintendo-3ds': 'nintendo-3ds',
};

/** Celulares: id do catalogo -> slug do modelo na OLX. */
function slugDeCelular(produto) {
  const marca = MARCA_POR_CATEGORIA[produto.marca];
  if (!marca) return null;

  // Os ids do catalogo carregam a marca ("samsung-galaxy-s24"), mas a OLX ja
  // tem a marca no caminho e usa so o modelo ("/samsung/galaxy-s24").
  const modelo = produto.id.startsWith(`${marca}-`) ? produto.id.slice(marca.length + 1) : produto.id;
  return `/celulares/${marca}/${modelo}`;
}

/**
 * Caminho de categoria para o produto, ou null quando nao houver mapeamento.
 * Nao inclui regiao: isso e acrescentado na montagem da URL.
 */
export function caminhoDeCategoria(produto) {
  if (!produto || produto.avulso) return null;

  if (produto.categoria === 'Videogames') {
    const slug = CONSOLES[produto.id];
    return slug ? `/games/consoles-de-video-game/${slug}` : '/games/consoles-de-video-game';
  }

  if (produto.categoria === 'Celulares') return slugDeCelular(produto);

  return null;
}

/** Categoria "pai", usada quando o slug do modelo nao existe mais. */
export function caminhoDaCategoriaPai(produto) {
  if (!produto || produto.avulso) return null;
  if (produto.categoria === 'Videogames') return '/games/consoles-de-video-game';
  if (produto.categoria === 'Celulares') return '/celulares';
  if (produto.categoria === 'Tablets') return '/tablets';
  if (produto.categoria === 'Notebooks') return '/computadores-e-acessorios/notebooks';
  return null;
}

/** Sufixo de regiao: /estado-sp/sao-paulo-e-regiao */
export function sufixoDeRegiao({ uf, regiao } = {}) {
  if (!uf) return '';
  return regiao ? `/estado-${uf}/${regiao}` : `/estado-${uf}`;
}
