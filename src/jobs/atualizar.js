import config from '../config.js';
import { CATALOGO, buscarProduto } from '../catalog/index.js';
import { analisar } from '../services/mercado.js';
import { salvarSnapshot } from '../store.js';

/**
 * Atualiza a tabela de precificacao percorrendo o catalogo.
 * Roda em serie de proposito: coletar tudo em paralelo derruba a coleta,
 * porque os marketplaces limitam requisicoes por IP.
 */

let execucao = null;

export function estadoAtual() {
  return execucao
    ? { ...execucao, emAndamento: execucao.terminadoEm === null }
    : { emAndamento: false, nunca: true };
}

export function emAndamento() {
  return !!execucao && execucao.terminadoEm === null;
}

export async function atualizarCatalogo({ ids = null, categoria = null, forcar = true, aoProgredir = null } = {}) {
  if (emAndamento()) throw new Error('Ja existe uma atualizacao em andamento.');

  let alvos = CATALOGO;
  if (ids?.length) alvos = ids.map(buscarProduto).filter(Boolean);
  else if (categoria) alvos = CATALOGO.filter((p) => p.categoria === categoria);

  execucao = {
    iniciadoEm: new Date().toISOString(),
    terminadoEm: null,
    total: alvos.length,
    concluidos: 0,
    comDados: 0,
    comErro: 0,
    atual: null,
    erros: [],
  };

  for (const produto of alvos) {
    execucao.atual = produto.nome;
    try {
      const resultado = await analisar(produto, { forcar });
      salvarSnapshot(produto.id, resultado);
      if (resultado.estatisticas?.suficiente) execucao.comDados++;
    } catch (erro) {
      execucao.comErro++;
      execucao.erros.push({ produto: produto.nome, erro: erro.message });
    }
    execucao.concluidos++;
    aoProgredir?.({ ...execucao });
  }

  execucao.atual = null;
  execucao.terminadoEm = new Date().toISOString();
  return { ...execucao };
}

export const configuracaoDeColeta = () => ({
  maxPaginas: config.coleta.maxPaginas,
  delayMs: config.coleta.delayMs,
  fontes: Object.entries(config.fontes).filter(([, v]) => v).map(([k]) => k),
});
