import config from '../config.js';
import { fontesAtivas } from '../sources/index.js';
import { filtrar } from '../pipeline/filtro.js';
import { calcular, arbitragem } from '../pipeline/estatistica.js';
import { detectar, tetoDeCompra } from '../pipeline/oportunidades.js';
import { buscarProduto, produtoAvulso, CATALOGO } from '../catalog/index.js';
import { salvarSnapshot, snapshotValido, lerSnapshot, tendencia } from '../store.js';

/** Roda uma fonte para todos os termos do produto, tolerando falha isolada. */
async function coletarDaFonte(fonte, produto, opcoes) {
  const anuncios = [];
  const diagnosticos = [];

  for (const termo of produto.consultas) {
    // O produto vai junto: a OLX usa isso para montar o caminho de categoria
    // em vez de buscar por texto.
    const resultado = await fonte.coletar(termo, { ...opcoes, produto });
    anuncios.push(...resultado.anuncios);
    diagnosticos.push(resultado.diagnostico);
  }

  return { fonte: fonte.ID, nome: fonte.NOME, anuncios, diagnostico: diagnosticos[0] || null };
}

/**
 * Analise completa de um produto: coleta -> filtro -> estatistica -> oportunidades.
 */
export async function analisar(produto, opcoes = {}) {
  const inicio = Date.now();
  const fontes = opcoes.fontes
    ? fontesAtivas().filter((f) => opcoes.fontes.includes(f.ID))
    : fontesAtivas();

  const resultados = await Promise.allSettled(
    fontes.map((fonte) => coletarDaFonte(fonte, produto, opcoes)),
  );

  const brutos = [];
  const statusFontes = [];

  resultados.forEach((resultado, i) => {
    const fonte = fontes[i];
    if (resultado.status === 'fulfilled') {
      brutos.push(...resultado.value.anuncios);
      statusFontes.push({
        id: fonte.ID, nome: fonte.NOME, ok: true,
        encontrados: resultado.value.anuncios.length,
        via: resultado.value.diagnostico?.via ?? null,
        metodo: resultado.value.diagnostico?.metodo ?? null,
        estrategia: resultado.value.diagnostico?.estrategia ?? null,
      });
    } else {
      statusFontes.push({
        id: fonte.ID, nome: fonte.NOME, ok: false,
        encontrados: 0, erro: resultado.reason?.message || String(resultado.reason),
      });
    }
  });

  const { aprovados, rejeitados } = filtrar(brutos, produto, opcoes);
  const estatisticas = calcular(aprovados);
  const oportunidades = detectar(aprovados, estatisticas, opcoes);

  return {
    produtoId: produto.id,
    nome: produto.nome,
    categoria: produto.categoria,
    marca: produto.marca,
    avulso: !!produto.avulso,
    atualizadoEm: new Date().toISOString(),
    duracaoMs: Date.now() - inicio,
    fontes: statusFontes,
    coletados: brutos.length,
    analisados: aprovados.length,
    somentePessoaFisica: opcoes.somentePessoaFisica ?? config.somentePessoaFisica,
    estrategiaOlx: statusFontes.find((f) => f.id === 'olx')?.estrategia ?? null,
    descartados: rejeitados.length,
    motivosDescarte: resumirMotivos(rejeitados),
    estatisticas,
    arbitragem: arbitragem(estatisticas.porFonte),
    tetoDeCompra: estatisticas.mediana ? tetoDeCompra(estatisticas.mediana, { ...config.negocio, ...(opcoes.negocio || {}) }) : null,
    precoVendaRapida: estatisticas.mediana ? estatisticas.mediana * (1 - (opcoes.negocio?.descontoVendaRapida ?? config.negocio.descontoVendaRapida)) : null,
    oportunidades,
    anuncios: aprovados.sort((a, b) => a.preco - b.preco),
    tendencia: tendencia(produto.id),
  };
}

function resumirMotivos(rejeitados) {
  const contagem = {};
  for (const r of rejeitados) {
    const chave = String(r.motivo).replace(/:.*$/, '').trim();
    contagem[chave] = (contagem[chave] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(contagem).sort((a, b) => b[1] - a[1]));
}

/** Analisa um produto do catalogo, usando cache quando ainda esta fresco. */
export async function analisarProduto(produtoId, opcoes = {}) {
  const produto = buscarProduto(produtoId);
  if (!produto) throw new Error(`Produto desconhecido: ${produtoId}`);

  if (!opcoes.forcar) {
    const cache = snapshotValido(produtoId, opcoes.cacheMin ?? config.cacheMin);
    if (cache) return { ...cache, doCache: true };
  }

  const resultado = await analisar(produto, opcoes);
  salvarSnapshot(produtoId, resultado);
  return { ...resultado, doCache: false };
}

/** Busca livre: qualquer termo digitado pelo usuario. */
export async function buscarTermo(termo, opcoes = {}) {
  const produto = produtoAvulso(termo);
  if (!opcoes.forcar) {
    const cache = snapshotValido(produto.id, opcoes.cacheMin ?? config.cacheMin);
    if (cache) return { ...cache, doCache: true };
  }
  const resultado = await analisar(produto, opcoes);
  salvarSnapshot(produto.id, resultado);
  return { ...resultado, doCache: false };
}

/** Tabela de precificacao: o que ja foi coletado para o catalogo. */
export function tabelaDePrecos() {
  return CATALOGO.map((produto) => {
    const snap = lerSnapshot(produto.id);
    if (!snap?.estatisticas?.suficiente) {
      return {
        produtoId: produto.id, nome: produto.nome, categoria: produto.categoria,
        marca: produto.marca, semDados: true,
        atualizadoEm: snap?.atualizadoEm ?? null,
        analisados: snap?.analisados ?? 0,
      };
    }
    const e = snap.estatisticas;
    return {
      produtoId: produto.id,
      nome: produto.nome,
      categoria: produto.categoria,
      marca: produto.marca,
      semDados: false,
      atualizadoEm: snap.atualizadoEm,
      n: e.n,
      min: e.min,
      p25: e.p25,
      mediana: e.mediana,
      p75: e.p75,
      max: e.max,
      confianca: e.confianca,
      amplitudeRelativa: e.amplitudeRelativa,
      tetoDeCompra: snap.tetoDeCompra,
      precoVendaRapida: snap.precoVendaRapida,
      porFonte: e.porFonte,
      arbitragem: snap.arbitragem,
      oportunidades: (snap.oportunidades || []).length,
      melhorOportunidade: (snap.oportunidades || [])[0] || null,
      tendencia: snap.tendencia ?? null,
    };
  });
}

/** Melhores oportunidades de todo o catalogo, ja coletado. */
export function melhoresOportunidades({ limite = 60, riscoMaximo = 'medio' } = {}) {
  const ordemRisco = { baixo: 0, medio: 1, alto: 2 };
  const teto = ordemRisco[riscoMaximo] ?? 1;
  const todas = [];

  for (const linha of tabelaDePrecos()) {
    if (linha.semDados) continue;
    const snap = lerSnapshot(linha.produtoId);
    for (const oportunidade of snap.oportunidades || []) {
      if ((ordemRisco[oportunidade.risco] ?? 2) > teto) continue;
      todas.push({
        ...oportunidade,
        produtoId: linha.produtoId,
        produto: linha.nome,
        categoria: linha.categoria,
        mediana: linha.mediana,
        confianca: linha.confianca,
        atualizadoEm: linha.atualizadoEm,
      });
    }
  }

  return todas.sort((a, b) => b.score - a.score || b.lucro - a.lucro).slice(0, limite);
}
