import config from '../config.js';
import { rotuloArmazenamento } from '../lib/texto.js';

/** Percentil com interpolacao linear. Espera lista JA ordenada. */
export function percentil(ordenados, p) {
  if (!ordenados.length) return null;
  if (ordenados.length === 1) return ordenados[0];
  const posicao = (ordenados.length - 1) * p;
  const base = Math.floor(posicao);
  const resto = posicao - base;
  if (base + 1 < ordenados.length) {
    return ordenados[base] + resto * (ordenados[base + 1] - ordenados[base]);
  }
  return ordenados[base];
}

export function mediana(valores) {
  return percentil([...valores].sort((a, b) => a - b), 0.5);
}

/**
 * Remove outliers pelo criterio de Tukey (cercas do IQR).
 * Usa mediana/IQR em vez de media/desvio porque anuncio de marketplace
 * tem cauda longa: um "R$ 99.999" destruiria a media.
 */
export function removerOutliers(valores, k = config.estatistica.iqrK) {
  const ordenados = [...valores].sort((a, b) => a - b);
  if (ordenados.length < 4) return { mantidos: ordenados, removidos: [], limites: null };

  const q1 = percentil(ordenados, 0.25);
  const q3 = percentil(ordenados, 0.75);
  const iqr = q3 - q1;
  const inferior = q1 - k * iqr;
  const superior = q3 + k * iqr;

  const mantidos = [];
  const removidos = [];
  for (const v of ordenados) (v >= inferior && v <= superior ? mantidos : removidos).push(v);
  return { mantidos, removidos, limites: { inferior, superior, q1, q3, iqr } };
}

function nivelConfianca(n) {
  if (n >= 25) return { nivel: 'alta', rotulo: 'Alta' };
  if (n >= 12) return { nivel: 'media', rotulo: 'Media' };
  if (n >= config.estatistica.minAmostra) return { nivel: 'baixa', rotulo: 'Baixa' };
  return { nivel: 'insuficiente', rotulo: 'Amostra insuficiente' };
}

function resumoDePrecos(precos) {
  const ordenados = [...precos].sort((a, b) => a - b);
  const soma = ordenados.reduce((a, b) => a + b, 0);
  const media = soma / ordenados.length;
  const variancia = ordenados.reduce((acc, v) => acc + (v - media) ** 2, 0) / ordenados.length;
  return {
    n: ordenados.length,
    min: ordenados[0],
    p10: percentil(ordenados, 0.10),
    p25: percentil(ordenados, 0.25),
    mediana: percentil(ordenados, 0.50),
    p75: percentil(ordenados, 0.75),
    p90: percentil(ordenados, 0.90),
    max: ordenados[ordenados.length - 1],
    media,
    desvio: Math.sqrt(variancia),
  };
}

/**
 * Estatistica completa de um conjunto de anuncios ja filtrados.
 * A referencia de mercado e a MEDIANA (resistente a outlier), nao a media.
 */
export function calcular(anuncios) {
  const precos = anuncios.map((a) => a.preco).filter((p) => Number.isFinite(p) && p > 0);
  if (!precos.length) {
    return { n: 0, nBruto: anuncios.length, confianca: nivelConfianca(0), suficiente: false };
  }

  const { mantidos, removidos, limites } = removerOutliers(precos);
  const base = mantidos.length >= 3 ? mantidos : precos;
  const resumo = resumoDePrecos(base);
  const confianca = nivelConfianca(resumo.n);

  // Dispersao relativa: quanto o mercado deste item varia.
  const amplitude = resumo.mediana > 0 ? (resumo.p75 - resumo.p25) / resumo.mediana : 0;

  return {
    ...resumo,
    nBruto: precos.length,
    outliersRemovidos: removidos.length,
    limites,
    amplitudeRelativa: amplitude,
    confianca,
    suficiente: resumo.n >= config.estatistica.minAmostra,
    porFonte: agruparPor(anuncios, (a) => a.fonte),
    porArmazenamento: agruparPor(
      anuncios.filter((a) => a.armazenamento),
      (a) => rotuloArmazenamento(a.armazenamento),
    ),
    porCondicao: agruparPor(anuncios, (a) => a.condicao || 'usado'),
  };
}

/** Mediana e contagem por grupo (fonte, armazenamento, condicao). */
function agruparPor(anuncios, chaveDe) {
  const grupos = new Map();
  for (const a of anuncios) {
    if (!Number.isFinite(a.preco)) continue;
    const chave = chaveDe(a);
    if (!chave) continue;
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave).push(a.preco);
  }
  const saida = {};
  for (const [chave, precos] of grupos) {
    if (precos.length < 2) { saida[chave] = { n: precos.length, mediana: mediana(precos) }; continue; }
    const { mantidos } = removerOutliers(precos);
    const base = mantidos.length >= 2 ? mantidos : precos;
    saida[chave] = { n: precos.length, mediana: mediana(base) };
  }
  return saida;
}

/**
 * Compara a mediana entre plataformas e aponta arbitragem:
 * comprar onde esta mais barato e vender onde esta mais caro.
 */
export function arbitragem(porFonte) {
  const entradas = Object.entries(porFonte || {}).filter(([, v]) => v.n >= 3);
  if (entradas.length < 2) return null;
  entradas.sort((a, b) => a[1].mediana - b[1].mediana);
  const barata = entradas[0];
  const cara = entradas[entradas.length - 1];
  const diferenca = cara[1].mediana - barata[1].mediana;
  if (diferenca <= 0) return null;
  return {
    comprarEm: barata[0],
    medianaCompra: barata[1].mediana,
    venderEm: cara[0],
    medianaVenda: cara[1].mediana,
    diferenca,
    percentual: diferenca / barata[1].mediana,
  };
}
