#!/usr/bin/env node
/**
 * Gera o site estatico a partir dos dados ja coletados.
 *
 * A interface e a mesma do app local; a diferenca e a origem dos dados:
 * em vez de chamar a API, ela le arquivos JSON gerados aqui. Isso permite
 * publicar no GitHub Pages, onde nao existe servidor rodando.
 *
 *   node bin/gerar-site.js
 */
import fs from 'node:fs';
import path from 'node:path';
import config, { ROOT } from '../src/config.js';
import { CATALOGO, categorias } from '../src/catalog/index.js';
import { listarFontes } from '../src/sources/index.js';
import { tabelaDePrecos, melhoresOportunidades } from '../src/services/mercado.js';
import { lerSnapshot, lerHistorico } from '../src/store.js';

const SAIDA = path.join(ROOT, 'site');
const DADOS = path.join(SAIDA, 'dados');

function gravar(destino, conteudo) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, typeof conteudo === 'string' ? conteudo : JSON.stringify(conteudo));
}

function copiarPasta(origem, destino) {
  fs.mkdirSync(destino, { recursive: true });
  for (const entrada of fs.readdirSync(origem, { withFileTypes: true })) {
    const de = path.join(origem, entrada.name);
    const para = path.join(destino, entrada.name);
    if (entrada.isDirectory()) copiarPasta(de, para);
    else fs.copyFileSync(de, para);
  }
}

console.log('\nGerando site estatico...');

fs.rmSync(SAIDA, { recursive: true, force: true });
copiarPasta(path.join(ROOT, 'public'), SAIDA);

// O GitHub Pages ignora pastas com _ se o Jekyll estiver ligado.
gravar(path.join(SAIDA, '.nojekyll'), '');

const linhas = tabelaDePrecos();
const comDados = linhas.filter((l) => !l.semDados);

// Diagnostico da coleta: quais fontes responderam de fato.
const fontes = new Map();
for (const linha of comDados) {
  const snap = lerSnapshot(linha.produtoId);
  for (const f of snap?.fontes || []) {
    const atual = fontes.get(f.id) || { id: f.id, nome: f.nome, ok: 0, falhou: 0, anuncios: 0, erro: null };
    if (f.ok) { atual.ok++; atual.anuncios += f.encontrados || 0; }
    else { atual.falhou++; atual.erro = atual.erro || f.erro; }
    fontes.set(f.id, atual);
  }
}

gravar(path.join(DADOS, 'config.json'), {
  regiao: config.regiao,
  negocio: config.negocio,
  coleta: { maxPaginas: config.coleta.maxPaginas, cacheMin: config.cacheMin },
  somentePessoaFisica: config.somentePessoaFisica,
  fontes: listarFontes(),
  navegador: true,
  categorias: categorias(),
  totalProdutos: CATALOGO.length,
  estatico: true,
  geradoEm: new Date().toISOString(),
  diagnostico: [...fontes.values()],
});

gravar(path.join(DADOS, 'tabela.json'), { linhas, atualizacao: { emAndamento: false, nunca: false } });
gravar(path.join(DADOS, 'oportunidades.json'), { oportunidades: melhoresOportunidades({ limite: 200, riscoMaximo: 'alto' }) });
gravar(path.join(DADOS, 'catalogo.json'), CATALOGO.map(({ id, nome, categoria, marca, faixa }) => ({ id, nome, categoria, marca, faixa })));
gravar(path.join(DADOS, 'historico.json'), lerHistorico());

let produtos = 0;
for (const produto of CATALOGO) {
  const snap = lerSnapshot(produto.id);
  if (!snap) continue;
  gravar(path.join(DADOS, 'produto', `${produto.id}.json`), snap);
  produtos++;
}

console.log(`  produtos com dados .. ${comDados.length}/${linhas.length}`);
console.log(`  paginas de detalhe .. ${produtos}`);
console.log(`  oportunidades ....... ${melhoresOportunidades({ limite: 200, riscoMaximo: 'alto' }).length}`);
for (const f of fontes.values()) {
  console.log(`  ${f.nome.padEnd(22)} ${f.ok} ok / ${f.falhou} falhas${f.erro ? ` (${f.erro.slice(0, 60)})` : ''}`);
}
console.log(`\n  Site em: ${path.relative(process.cwd(), SAIDA)}\n`);
