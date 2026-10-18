#!/usr/bin/env node
/**
 * Busca um item pelo terminal, sem abrir a interface.
 *
 *   npm run buscar -- "iphone 13 pro"
 *   npm run buscar -- iphone-12          (id do catalogo)
 */
import { analisar } from '../src/services/mercado.js';
import { buscarProduto, produtoAvulso } from '../src/catalog/index.js';
import { salvarSnapshot } from '../src/store.js';
import { encerrarNavegador } from '../src/lib/navegador.js';

const termo = process.argv.slice(2).join(' ').trim();
if (!termo) {
  console.error('Uso: npm run buscar -- "iphone 13"');
  process.exit(1);
}

const dinheiro = (v) => v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const pct = (v) => v == null ? '—' : `${(v * 100).toFixed(0)}%`;

const produto = buscarProduto(termo) || produtoAvulso(termo);

console.log(`\nBuscando "${produto.nome}"...\n`);
const resultado = await analisar(produto);

for (const f of resultado.fontes) {
  console.log(`  ${f.nome.padEnd(22)} ${f.ok ? `${f.encontrados} anuncios` : `FALHOU: ${f.erro}`}`);
}

const e = resultado.estatisticas;
if (!e.suficiente) {
  console.log(`\n  Amostra insuficiente: ${resultado.analisados} anuncios validos de ${resultado.coletados} coletados.`);
  console.log(`  Motivos de descarte: ${JSON.stringify(resultado.motivosDescarte)}\n`);
  await encerrarNavegador();
  process.exit(0);
}

console.log(`\n${'='.repeat(62)}`);
console.log(`  ${produto.nome.toUpperCase()}`);
console.log('='.repeat(62));
console.log(`  Anuncios validos ....... ${resultado.analisados} (de ${resultado.coletados} coletados)`);
console.log(`  Minimo ................. ${dinheiro(e.min)}`);
console.log(`  P25 .................... ${dinheiro(e.p25)}`);
console.log(`  PRECO DE MERCADO ....... ${dinheiro(e.mediana)}   <- mediana`);
console.log(`  P75 .................... ${dinheiro(e.p75)}`);
console.log(`  Maximo ................. ${dinheiro(e.max)}`);
console.log(`  Confianca .............. ${e.confianca.rotulo}`);
console.log(`\n  PAGUE NO MAXIMO ........ ${dinheiro(resultado.tetoDeCompra)}`);
console.log(`  ANUNCIE POR ............ ${dinheiro(resultado.precoVendaRapida)}`);

if (resultado.arbitragem) {
  const a = resultado.arbitragem;
  console.log(`\n  Arbitragem: comprar no ${a.comprarEm} (${dinheiro(a.medianaCompra)}) e vender no ${a.venderEm} (${dinheiro(a.medianaVenda)})`);
  console.log(`              diferenca de ${dinheiro(a.diferenca)} (${pct(a.percentual)})`);
}

console.log(`\n  OPORTUNIDADES (${resultado.oportunidades.length})`);
console.log('  ' + '-'.repeat(60));
if (!resultado.oportunidades.length) {
  console.log('  Nenhum anuncio abaixo do teto de compra agora.');
}
for (const o of resultado.oportunidades.slice(0, 12)) {
  console.log(`  [${String(o.score).padStart(3)}] ${dinheiro(o.preco).padStart(11)} -> lucro ${dinheiro(o.lucro).padStart(10)} (ROI ${pct(o.roi).padStart(4)}) ${o.risco !== 'baixo' ? `[risco ${o.risco}]` : ''}`);
  console.log(`        ${o.titulo.slice(0, 58)}`);
  console.log(`        ${o.cidade || '—'}${o.uf ? '/' + o.uf : ''} · ${o.fonte}${o.url ? ` · ${o.url}` : ''}`);
}

salvarSnapshot(produto.id, resultado);
console.log(`\n  Salvo em data/snapshots/${produto.id}.json\n`);
await encerrarNavegador();
