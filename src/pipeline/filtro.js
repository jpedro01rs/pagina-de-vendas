import config from '../config.js';
import { normalizar, cabecaDoTitulo } from '../lib/texto.js';

/**
 * Termos que descrevem ACESSORIO / PECA / SERVICO, nunca o produto em si.
 * Sao checados apenas na CABECA do titulo (parte antes de "com", "+",
 * "acompanha"...), para nao descartar "iPhone 12 com capa e carregador".
 */
const ACESSORIO = [
  'capa', 'capinha', 'case', 'pelicula', 'película', 'vidro', 'bumper',
  'carregador', 'cabo', 'fonte', 'adaptador', 'dock', 'base', 'suporte',
  'fone', 'fones', 'headset', 'earphone',
  'tela', 'display', 'touch', 'frontal', 'placa', 'flex', 'conector',
  'bateria', 'tampa', 'aro', 'chassi', 'carcaca', 'lente', 'camera',
  'controle', 'joystick', 'manete', 'analogico',
  'jogo', 'jogos', 'midia', 'cartucho', 'disco', 'game', 'games',
  'memory', 'cartao', 'hd', 'ssd',
  'skin', 'adesivo', 'mochila', 'bolsa', 'maleta',
];

/** Termos que invalidam o anuncio em QUALQUER posicao do titulo. */
const DESQUALIFICA = [
  'defeito', 'quebrado', 'quebrada', 'trincado', 'trincada', 'rachado',
  'sucata', 'peca', 'pecas', 'retirada', 'retirar', 'nao liga', 'nao funciona',
  'bloqueado', 'bloqueada', 'icloud', 'conta bloqueada', 'chip bloqueado',
  'conserto', 'consertos', 'manutencao', 'assistencia', 'reparo',
  'aluguel', 'alugo', 'aluga', 'locacao',
  'procuro', 'compro', 'comprar', 'busco', 'precisa',
  'replica', 'similar', 'generico', 'paralelo', 'clone',
  'rifa', 'sorteio', 'consorcio', 'financiamento',
];

/** Termos de anuncio de loja/lote que atrapalham a mediana de varejo pessoal. */
const LOTE = ['lote', 'atacado', 'revenda', 'kit com', 'varias unidades', 'diversos modelos'];

/**
 * Linguagem que so aparece em anuncio de loja. Usada quando a OLX nao marcou
 * o anuncio como profissional.
 *
 * A lista e curta de proposito: pessoa fisica tambem diz "nota fiscal" e
 * "aceito cartao", entao so entram sinais que praticamente nao saem da boca
 * de um vendedor individual.
 */
const LOJA = [
  'loja', 'lojas', 'nossa loja', 'somos loja',
  'assistencia tecnica', 'cnpj', 'razao social',
  'distribuidora', 'importadora', 'revendedor autorizado', 'credenciada',
  'todos os modelos', 'varios modelos', 'consulte outros modelos',
  'orcamento sem compromisso', 'atendemos', 'nossa equipe',
  'garantia de 6 meses', 'garantia de 1 ano', 'garantia de 12 meses',
];

function contemTermo(texto, termos) {
  return acharTermo(texto, termos)?.termo ?? null;
}

/** Acha o primeiro termo da lista e em que posicao ele aparece. */
function acharTermo(texto, termos) {
  let melhor = null;
  for (const termo of termos) {
    const t = normalizar(termo);
    if (!t) continue;
    const padrao = new RegExp(`(^|[^a-z0-9])(${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})($|[^a-z0-9])`);
    const achado = padrao.exec(texto);
    if (achado) {
      const posicao = achado.index + achado[1].length;
      if (!melhor || posicao < melhor.posicao) melhor = { termo, posicao };
    }
  }
  return melhor;
}

/** Posicao em que o modelo do produto aparece no texto (null se nao aparece). */
function posicaoDoModelo(texto, produto) {
  if (produto.padrao) {
    const achado = new RegExp(produto.padrao).exec(texto);
    return achado ? achado.index : null;
  }
  const termos = normalizar(produto.nome).split(' ').filter((t) => t.length > 1);
  let maior = null;
  for (const t of termos) {
    const i = texto.indexOf(t);
    if (i === -1) return null;
    maior = maior === null ? i : Math.max(maior, i);
  }
  return maior;
}

/**
 * Decide se um anuncio representa mesmo o produto procurado.
 * Retorna { ok: true } ou { ok: false, motivo: '...' }.
 */
export function avaliarRelevancia(anuncio, produto, opcoes = {}) {
  const tituloNorm = normalizar(anuncio.titulo);
  if (!tituloNorm) return { ok: false, motivo: 'titulo vazio' };

  const cabeca = cabecaDoTitulo(anuncio.titulo);

  const desqualificador = contemTermo(tituloNorm, DESQUALIFICA);
  if (desqualificador) return { ok: false, motivo: `desqualificado: ${desqualificador}` };

  // Um termo de acessorio so descarta o anuncio quando vem ANTES do modelo:
  // em portugues o nucleo do anuncio e o termo mais a esquerda.
  // "Controle PS4" = acessorio. "PS4 Slim 1TB 5 jogos" = console com jogos.
  const acessorio = acharTermo(cabeca, ACESSORIO);
  if (acessorio) {
    const posModelo = posicaoDoModelo(cabeca, produto);
    if (posModelo === null || acessorio.posicao < posModelo) {
      return { ok: false, motivo: `acessorio/peca: ${acessorio.termo}` };
    }
  }

  const lote = contemTermo(tituloNorm, LOTE);
  if (lote) return { ok: false, motivo: `lote/atacado: ${lote}` };

  // Pessoa fisica x empresa: o mercado que voce disputa e o de gente comum.
  // Loja precifica com garantia, nota e parcelamento embutidos, o que puxa a
  // mediana para cima e faz voce achar que ha margem onde nao ha.
  if (opcoes.somentePessoaFisica ?? config.somentePessoaFisica) {
    if (anuncio.profissional === true) {
      return { ok: false, motivo: 'anuncio de loja (marcado pela plataforma)' };
    }
    const marcaDeLoja = contemTermo(tituloNorm, LOJA)
      || (anuncio.vendedor ? contemTermo(normalizar(anuncio.vendedor), LOJA) : null);
    if (marcaDeLoja) return { ok: false, motivo: `anuncio de loja: ${marcaDeLoja}` };
  }

  // Modelo precisa aparecer na cabeca do titulo.
  if (produto.padrao) {
    const re = new RegExp(produto.padrao);
    if (!re.test(cabeca)) return { ok: false, motivo: 'modelo nao identificado no titulo' };
  } else {
    // Busca livre: exige que todas as palavras do termo aparecam.
    const termos = normalizar(produto.nome).split(' ').filter((t) => t.length > 1);
    const faltando = termos.filter((t) => !tituloNorm.includes(t));
    if (faltando.length) return { ok: false, motivo: `nao contem: ${faltando.join(', ')}` };
  }

  for (const token of produto.exigir || []) {
    if (!contemTermo(cabeca, [token])) return { ok: false, motivo: `falta variante: ${token}` };
  }
  for (const padrao of produto.exigirPadrao || []) {
    if (!new RegExp(padrao).test(cabeca)) return { ok: false, motivo: `falta variante (padrao): ${padrao}` };
  }
  for (const token of produto.proibir || []) {
    if (contemTermo(cabeca, [token])) return { ok: false, motivo: `outra variante: ${token}` };
  }
  for (const padrao of produto.proibirPadrao || []) {
    if (new RegExp(padrao).test(cabeca)) return { ok: false, motivo: `outro modelo: ${padrao}` };
  }

  // Guarda de sanidade de preco: derruba peca solta barata e golpe.
  if (produto.faixa && anuncio.preco != null) {
    const [min, max] = produto.faixa;
    if (anuncio.preco < min) return { ok: false, motivo: `preco abaixo da faixa (< R$ ${min})` };
    if (anuncio.preco > max) return { ok: false, motivo: `preco acima da faixa (> R$ ${max})` };
  }

  return { ok: true };
}

/** Remove anuncios repetidos (mesmo id de fonte, ou mesmo titulo+preco+local). */
export function deduplicar(anuncios) {
  const vistos = new Set();
  const saida = [];
  for (const a of anuncios) {
    const chaveId = a.fonte && a.idExterno ? `${a.fonte}:${a.idExterno}` : null;
    const chaveConteudo = `${normalizar(a.titulo)}|${a.preco}|${normalizar(a.cidade || '')}`;
    if (chaveId && vistos.has(chaveId)) continue;
    if (vistos.has(chaveConteudo)) continue;
    if (chaveId) vistos.add(chaveId);
    vistos.add(chaveConteudo);
    saida.push(a);
  }
  return saida;
}

/** Aplica relevancia + dedup e devolve aprovados e um resumo das rejeicoes. */
export function filtrar(anuncios, produto, opcoes = {}) {
  const aprovados = [];
  const rejeitados = [];
  for (const anuncio of anuncios) {
    if (anuncio.preco == null) { rejeitados.push({ ...anuncio, motivo: 'sem preco' }); continue; }
    const veredito = avaliarRelevancia(anuncio, produto, opcoes);
    if (veredito.ok) aprovados.push(anuncio);
    else rejeitados.push({ ...anuncio, motivo: veredito.motivo });
  }
  return { aprovados: deduplicar(aprovados), rejeitados };
}

export const _internos = { ACESSORIO, DESQUALIFICA, LOTE, LOJA, contemTermo, acharTermo, posicaoDoModelo };
