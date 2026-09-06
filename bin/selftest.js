#!/usr/bin/env node
/**
 * Autoteste do miolo do sistema: estatistica, filtro e calculo de lucro.
 * Nao acessa a internet - valida a logica com dados sinteticos.
 * Rode com: npm run selftest
 */
import { percentil, calcular, removerOutliers, arbitragem } from '../src/pipeline/estatistica.js';
import { detectar, simularLucro, tetoDeCompra } from '../src/pipeline/oportunidades.js';
import { filtrar } from '../src/pipeline/filtro.js';
import { buscarProduto } from '../src/catalog/index.js';
import { precoParaNumero } from '../src/lib/texto.js';

let falhas = 0;
let total = 0;

function verificar(nome, condicao, detalhe = '') {
  total++;
  if (condicao) {
    console.log(`  ok    ${nome}`);
  } else {
    falhas++;
    console.log(`  FALHA ${nome} ${detalhe}`);
  }
}
const perto = (a, b, tol = 0.01) => Math.abs(a - b) <= tol;

console.log('\n== Precos em formato brasileiro ==');
verificar('R$ 1.500 -> 1500', precoParaNumero('R$ 1.500') === 1500);
verificar('R$ 1.500,90 -> 1500.9', perto(precoParaNumero('R$ 1.500,90'), 1500.9));
verificar('12.345,67 -> 12345.67', perto(precoParaNumero('12.345,67'), 12345.67));
verificar('texto sem numero -> null', precoParaNumero('A combinar') === null);

console.log('\n== Percentis ==');
const seq = [1, 2, 3, 4, 5];
verificar('p50 de 1..5 = 3', percentil(seq, 0.5) === 3);
verificar('p0 = 1', percentil(seq, 0) === 1);
verificar('p100 = 5', percentil(seq, 1) === 5);
verificar('p25 interpola = 2', percentil(seq, 0.25) === 2);

console.log('\n== Remocao de outliers (IQR) ==');
const comLixo = [1000, 1050, 1100, 1120, 1150, 1200, 99999, 1];
const { mantidos, removidos } = removerOutliers(comLixo);
verificar('descarta 99999 e 1', removidos.includes(99999) && removidos.includes(1),
  `removidos=${JSON.stringify(removidos)}`);
verificar('mantem os precos reais', mantidos.length === 6, `mantidos=${JSON.stringify(mantidos)}`);

console.log('\n== Estatistica de mercado ==');
const precosMercado = [1800, 1900, 1950, 2000, 2000, 2050, 2100, 2200, 2300, 2400, 2500, 2600, 45];
const anunciosFake = precosMercado.map((preco, i) => ({
  titulo: `iPhone 12 128GB #${i}`, preco, fonte: i % 2 ? 'olx' : 'enjoei',
  cidade: i % 3 ? 'Campinas' : 'Sao Paulo', uf: 'SP', armazenamento: 128, condicao: 'usado',
}));
const stats = calcular(anunciosFake);
verificar('mediana resiste ao preco de R$ 45', stats.mediana >= 2000 && stats.mediana <= 2100, `mediana=${stats.mediana}`);
verificar('outlier foi removido', stats.outliersRemovidos >= 1, `removidos=${stats.outliersRemovidos}`);
verificar('confianca media com n=12', stats.confianca.nivel === 'media', `n=${stats.n} nivel=${stats.confianca.nivel}`);
verificar('p25 < mediana < p75', stats.p25 < stats.mediana && stats.mediana < stats.p75);
verificar('quebra por fonte existe', !!stats.porFonte.olx && !!stats.porFonte.enjoei);

console.log('\n== Simulacao de lucro ==');
const negocio = { descontoVendaRapida: 0.08, custoFixo: 30, taxaPlataforma: 0, lucroMinimo: 100, roiMinimo: 0.12 };
const sim = simularLucro(1500, 2000, negocio);
verificar('venda rapida 8% abaixo da mediana', perto(sim.precoVendaRapida, 1840));
verificar('lucro = 1840 - 1500 - 30 = 310', perto(sim.lucro, 310));
verificar('roi = 310 / 1530', perto(sim.roi, 310 / 1530, 0.0001));

console.log('\n== Teto de compra ==');
const teto = tetoDeCompra(2000, negocio);
verificar('teto de compra ~ 1612.86', perto(teto, 1612.857, 0.01), `teto=${teto}`);
const noTeto = simularLucro(teto, 2000, negocio);
verificar('comprar no teto entrega exatamente o ROI minimo', perto(noTeto.roi, 0.12, 0.0001), `roi=${noTeto.roi}`);

console.log('\n== Deteccao de oportunidades ==');
const candidatos = [
  { titulo: 'iPhone 12 128GB', preco: 1400, fonte: 'olx', cidade: 'Sao Paulo', uf: 'SP' },
  { titulo: 'iPhone 12 128GB', preco: 1400, fonte: 'olx', cidade: 'Manaus', uf: 'AM' },
  { titulo: 'iPhone 12 128GB', preco: 2050, fonte: 'olx', cidade: 'Sao Paulo', uf: 'SP' },
  { titulo: 'iPhone 12 128GB', preco: 600, fonte: 'olx', cidade: 'Sao Paulo', uf: 'SP' },
];
const ops = detectar(candidatos, stats, { negocio, regiao: { uf: 'sp', cidade: 'Sao Paulo' } });
verificar('preco acima do teto fica de fora', !ops.some((o) => o.preco === 2050));
verificar('achou a oportunidade de 1400', ops.some((o) => o.preco === 1400));
const spVs = ops.find((o) => o.preco === 1400 && o.cidade === 'Sao Paulo');
const amVs = ops.find((o) => o.preco === 1400 && o.cidade === 'Manaus');
verificar('mesmo preco: cidade do usuario pontua mais', spVs && amVs && spVs.score > amVs.score,
  `sp=${spVs?.score} am=${amVs?.score}`);
const suspeito = ops.find((o) => o.preco === 600);
verificar('preco irreal marcado como risco alto', !suspeito || suspeito.risco === 'alto', `risco=${suspeito?.risco}`);
verificar('oportunidades vem ordenadas por score', ops.every((o, i) => i === 0 || ops[i - 1].score >= o.score));

console.log('\n== Arbitragem entre plataformas ==');
const arb = arbitragem({ olx: { n: 10, mediana: 1800 }, enjoei: { n: 8, mediana: 2200 } });
verificar('aponta comprar na olx e vender no enjoei', arb?.comprarEm === 'olx' && arb?.venderEm === 'enjoei');
verificar('diferenca de R$ 400', perto(arb.diferenca, 400));

console.log('\n== Filtro de relevancia ==');
const p12 = buscarProduto('iphone-12');
const brutos = [
  { titulo: 'iPhone 12 128GB', preco: 2100, fonte: 'olx', idExterno: '1' },
  { titulo: 'iPhone 12 128GB', preco: 2100, fonte: 'olx', idExterno: '1' },
  { titulo: 'Capa iPhone 12', preco: 40, fonte: 'olx', idExterno: '2' },
  { titulo: 'iPhone 12 Pro 256GB', preco: 3000, fonte: 'olx', idExterno: '3' },
  { titulo: 'iPhone 12 sem preco', preco: null, fonte: 'olx', idExterno: '4' },
];
const { aprovados, rejeitados } = filtrar(brutos, p12);
verificar('sobra apenas 1 anuncio valido', aprovados.length === 1, `aprovados=${aprovados.length}`);
verificar('duplicata removida', aprovados.filter((a) => a.idExterno === '1').length === 1);
verificar('rejeitados trazem o motivo', rejeitados.every((r) => !!r.motivo));

console.log(`\n${'-'.repeat(50)}`);
console.log(falhas === 0 ? `TUDO CERTO - ${total} verificacoes passaram` : `${falhas} de ${total} verificacoes FALHARAM`);
process.exit(falhas === 0 ? 0 : 1);
