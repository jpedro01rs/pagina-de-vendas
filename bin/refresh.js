#!/usr/bin/env node
/**
 * Atualiza a tabela de precificacao do catalogo inteiro.
 *
 *   npm run atualizar
 *   npm run atualizar -- Celulares      (so uma categoria)
 *
 * Leva varios minutos de proposito: a coleta e espacada para nao ser
 * bloqueada pelos marketplaces.
 */
import { atualizarCatalogo } from '../src/jobs/atualizar.js';
import { categorias } from '../src/catalog/index.js';
import { encerrarNavegador } from '../src/lib/navegador.js';

const categoria = process.argv.slice(2).join(' ').trim() || null;
if (categoria && !categorias().includes(categoria)) {
  console.error(`Categoria desconhecida: "${categoria}"`);
  console.error(`Disponiveis: ${categorias().join(', ')}`);
  process.exit(1);
}

const inicio = Date.now();
console.log(`\nAtualizando ${categoria ? `categoria "${categoria}"` : 'o catalogo inteiro'}...\n`);

const resultado = await atualizarCatalogo({
  categoria,
  aoProgredir: (p) => {
    const pct = ((p.concluidos / p.total) * 100).toFixed(0);
    process.stdout.write(`\r  [${String(pct).padStart(3)}%] ${p.concluidos}/${p.total}  ${String(p.atual || '').slice(0, 40).padEnd(42)}`);
  },
});

const minutos = ((Date.now() - inicio) / 60000).toFixed(1);
console.log(`\n\n  Concluido em ${minutos} min`);
console.log(`  Com preco calculado: ${resultado.comDados}`);
console.log(`  Sem dados suficientes: ${resultado.total - resultado.comDados - resultado.comErro}`);
console.log(`  Com erro: ${resultado.comErro}`);

for (const e of resultado.erros.slice(0, 10)) {
  console.log(`     ${e.produto}: ${e.erro}`);
}
console.log('\n  Abra a interface com: npm start\n');
await encerrarNavegador();
