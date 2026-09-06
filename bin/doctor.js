#!/usr/bin/env node
/**
 * Diagnostico das fontes de dados.
 *
 * Este comando faz uma consulta REAL a cada marketplace e mostra exatamente
 * o que voltou. E a forma mais rapida de descobrir se alguma fonte esta
 * bloqueada, mudou de formato ou precisa de login.
 *
 *   npm run doctor
 *   npm run doctor -- "iphone 13"
 *   npm run doctor -- --login-facebook
 */
import config from '../src/config.js';
import { FONTES, listarFontes } from '../src/sources/index.js';
import { estadoDoNavegador, encerrarNavegador } from '../src/lib/navegador.js';
import { filtrar } from '../src/pipeline/filtro.js';
import { calcular } from '../src/pipeline/estatistica.js';
import { produtoAvulso, buscarProduto } from '../src/catalog/index.js';
import * as facebook from '../src/sources/facebook.js';

const argumentos = process.argv.slice(2);
const querLogin = argumentos.includes('--login-facebook');
const termo = argumentos.filter((a) => !a.startsWith('--'))[0] || 'iphone 12';

const traco = (n = 66) => '-'.repeat(n);
const dinheiro = (v) => v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

async function principal() {
  if (querLogin) {
    console.log('\nAbrindo o navegador para login no Facebook...');
    await facebook.login();
    return;
  }

  console.log(`\n${traco()}\n  DIAGNOSTICO DO REVENDA RADAR\n${traco()}`);

  const navegador = await estadoDoNavegador();
  console.log(`\nAmbiente`);
  console.log(`  Node ................ ${process.version}`);
  console.log(`  Navegador ........... ${navegador.pronto ? 'pronto' : `INDISPONIVEL -> ${navegador.mensagem}`}`);
  console.log(`  Regiao .............. ${config.regiao.cidade || '(nao definida)'} / ${(config.regiao.uf || '--').toUpperCase()} ${config.regiao.slug ? `[${config.regiao.slug}]` : ''}`);
  console.log(`  Paginas por busca ... ${config.coleta.maxPaginas}`);
  console.log(`  Intervalo entre reqs. ${config.coleta.delayMs}ms`);

  console.log(`\nFontes configuradas`);
  for (const f of listarFontes()) {
    console.log(`  ${f.ativa ? '[ligada]  ' : '[desligada]'} ${f.nome}`);
  }

  console.log(`\n${traco()}\n  TESTE AO VIVO - termo: "${termo}"\n${traco()}`);

  const produto = buscarProduto(termo.toLowerCase().replace(/\s+/g, '-')) || produtoAvulso(termo);
  const todos = [];
  let algumaOk = false;

  for (const [id, fonte] of Object.entries(FONTES)) {
    if (!config.fontes[id]) {
      console.log(`\n  ${fonte.NOME}: desligada no .env (FONTE_${id.toUpperCase()}=false)`);
      continue;
    }

    process.stdout.write(`\n  ${fonte.NOME}... `);
    const inicio = Date.now();
    try {
      const { anuncios, diagnostico } = await fonte.coletar(termo, { maxPaginas: 1 });
      const segundos = ((Date.now() - inicio) / 1000).toFixed(1);

      if (!anuncios.length) {
        console.log(`respondeu, mas NAO trouxe anuncios (${segundos}s)`);
        console.log(`     via=${diagnostico?.via ?? '?'} metodo=${diagnostico?.metodo ?? 'http'}`);
        console.log('     Provavel mudanca de layout, bloqueio silencioso ou termo sem resultado.');
        continue;
      }

      algumaOk = true;
      todos.push(...anuncios);
      const precos = anuncios.map((a) => a.preco).filter(Boolean).sort((a, b) => a - b);
      console.log(`OK - ${anuncios.length} anuncios em ${segundos}s`);
      console.log(`     via=${diagnostico?.via ?? '?'}  metodo=${diagnostico?.metodo ?? 'http'}`);
      console.log(`     faixa bruta: ${dinheiro(precos[0])} .. ${dinheiro(precos[precos.length - 1])}`);
      for (const a of anuncios.slice(0, 3)) {
        console.log(`       - ${dinheiro(a.preco).padStart(11)}  ${a.titulo.slice(0, 52)}`);
      }
    } catch (erro) {
      console.log('FALHOU');
      console.log(`     ${erro.message}`);
      if (erro.name === 'PrecisaLogin') console.log('     -> rode: npm run doctor -- --login-facebook');
      else if (erro.bloqueado) console.log('     -> bloqueio anti-robo. Instale o navegador: npm run navegador');
    }
  }

  if (algumaOk) {
    console.log(`\n${traco()}\n  QUALIDADE DO FILTRO\n${traco()}`);
    const { aprovados, rejeitados } = filtrar(todos, produto);
    console.log(`\n  Coletados ....... ${todos.length}`);
    console.log(`  Passaram ........ ${aprovados.length}`);
    console.log(`  Descartados ..... ${rejeitados.length}`);

    const motivos = {};
    for (const r of rejeitados) {
      const chave = String(r.motivo).replace(/:.*$/, '');
      motivos[chave] = (motivos[chave] || 0) + 1;
    }
    for (const [motivo, qtd] of Object.entries(motivos).sort((a, b) => b[1] - a[1])) {
      console.log(`     ${String(qtd).padStart(4)}x  ${motivo}`);
    }

    const e = calcular(aprovados);
    if (e.suficiente) {
      console.log(`\n  Preco de mercado (mediana): ${dinheiro(e.mediana)}`);
      console.log(`  P25 ${dinheiro(e.p25)}  |  P75 ${dinheiro(e.p75)}  |  confianca: ${e.confianca.rotulo}`);
    } else {
      console.log(`\n  Amostra insuficiente para calcular preco (${e.n} anuncios validos).`);
    }
    console.log('\n  Se os titulos acima nao sao do produto certo, ajuste o catalogo em');
    console.log('  src/catalog/index.js (campos exigir / proibir / faixa).');
  } else {
    console.log(`\n${traco()}`);
    console.log('  NENHUMA FONTE RESPONDEU.');
    console.log('  1) Confira sua internet.');
    console.log('  2) Instale o navegador: npm run navegador');
    console.log('  3) Rode de novo: npm run doctor');
  }

  console.log(`\n${traco()}\n`);
}

principal()
  .catch((erro) => { console.error('\nErro no diagnostico:', erro.message); process.exitCode = 1; })
  .finally(() => encerrarNavegador());
