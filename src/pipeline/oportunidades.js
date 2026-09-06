import config from '../config.js';
import { mesmaCidade } from '../lib/texto.js';

/**
 * Simula a operacao de revenda para um preco de compra.
 * A venda e projetada um pouco ABAIXO da mediana para girar rapido.
 */
export function simularLucro(precoCompra, mediana, negocio = config.negocio) {
  const precoVendaRapida = mediana * (1 - negocio.descontoVendaRapida);
  const receitaLiquida = precoVendaRapida * (1 - negocio.taxaPlataforma);
  const investimento = precoCompra + negocio.custoFixo;
  const lucro = receitaLiquida - investimento;
  return {
    precoCompra,
    precoVendaRapida,
    receitaLiquida,
    custoFixo: negocio.custoFixo,
    taxaPlataforma: negocio.taxaPlataforma,
    investimento,
    lucro,
    roi: investimento > 0 ? lucro / investimento : 0,
    margem: precoVendaRapida > 0 ? lucro / precoVendaRapida : 0,
  };
}

/**
 * Teto de compra: o maximo que vale pagar para ainda bater o ROI minimo.
 * Deriva de  lucro / (compra + custoFixo) >= roiMinimo.
 */
export function tetoDeCompra(mediana, negocio = config.negocio) {
  const receitaLiquida = mediana * (1 - negocio.descontoVendaRapida) * (1 - negocio.taxaPlataforma);
  return receitaLiquida / (1 + negocio.roiMinimo) - negocio.custoFixo;
}

/** Preco tao baixo que provavelmente e golpe, peca ou anuncio errado. */
function avaliarRisco(anuncio, stats) {
  const razao = anuncio.preco / stats.mediana;
  if (razao < 0.45) return { risco: 'alto', aviso: 'Preco muito abaixo do mercado - confira se nao e golpe, peca ou aparelho bloqueado' };
  if (stats.limites && anuncio.preco < stats.limites.inferior) {
    return { risco: 'medio', aviso: 'Preco fora da faixa normal - confirme estado e procedencia antes de fechar' };
  }
  if (razao < 0.6) return { risco: 'medio', aviso: 'Bem abaixo da media - peca fotos, nota fiscal e teste de IMEI' };
  return { risco: 'baixo', aviso: null };
}

function pontuar({ desconto, stats, proximidade, risco }) {
  const pDesconto = Math.min(Math.max(desconto, 0) / 0.35, 1);
  const pConfianca = Math.min(stats.n / 25, 1);
  const pLiquidez = Math.min((stats.nBruto || stats.n) / 40, 1);
  let score = 100 * (0.50 * pDesconto + 0.20 * pConfianca + 0.15 * pLiquidez + 0.15 * proximidade);
  if (risco === 'alto') score *= 0.4;
  else if (risco === 'medio') score *= 0.8;
  return Math.round(score);
}

function proximidadeDe(anuncio, regiao) {
  if (regiao.cidade && mesmaCidade(anuncio.cidade, regiao.cidade)) return 1;
  if (regiao.uf && anuncio.uf && anuncio.uf.toLowerCase() === regiao.uf) return 0.6;
  return 0.2;
}

/**
 * Classifica cada anuncio como oportunidade de compra.
 * Ordena por score (desconto + confianca + liquidez + proximidade).
 */
export function detectar(anuncios, stats, opcoes = {}) {
  const negocio = { ...config.negocio, ...(opcoes.negocio || {}) };
  const regiao = { ...config.regiao, ...(opcoes.regiao || {}) };
  if (!stats?.suficiente || !stats.mediana) return [];

  const teto = tetoDeCompra(stats.mediana, negocio);

  const avaliados = anuncios.map((anuncio) => {
    const desconto = (stats.mediana - anuncio.preco) / stats.mediana;
    const { risco, aviso } = avaliarRisco(anuncio, stats);
    const proximidade = proximidadeDe(anuncio, regiao);
    const lucro = simularLucro(anuncio.preco, stats.mediana, negocio);
    return {
      ...anuncio,
      desconto,
      abaixoDaMediana: stats.mediana - anuncio.preco,
      risco,
      aviso,
      proximidade,
      perto: proximidade === 1,
      ...lucro,
      tetoDeCompra: teto,
      score: pontuar({ desconto, stats, proximidade, risco }),
    };
  });

  return avaliados
    .filter((a) => a.preco <= teto)
    .filter((a) => a.lucro >= negocio.lucroMinimo && a.roi >= negocio.roiMinimo)
    .sort((a, b) => b.score - a.score || b.lucro - a.lucro);
}
