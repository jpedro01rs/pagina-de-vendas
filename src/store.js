import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './config.js';

/**
 * Persistencia em arquivos JSON.
 * Sem banco de dados: menos coisa para instalar e voce pode abrir/versionar
 * os arquivos na mao. O volume aqui (dezenas de produtos) cabe folgado.
 */

const DIR_SNAPSHOTS = path.join(DATA_DIR, 'snapshots');
const ARQ_HISTORICO = path.join(DATA_DIR, 'historico.json');

function garantirPastas() {
  fs.mkdirSync(DIR_SNAPSHOTS, { recursive: true });
}

/** Escrita atomica: grava em .tmp e renomeia, para nao corromper em queda. */
function gravar(arquivo, dados) {
  garantirPastas();
  const temporario = `${arquivo}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(dados, null, 2));
  fs.renameSync(temporario, arquivo);
}

function ler(arquivo, padrao = null) {
  try {
    return JSON.parse(fs.readFileSync(arquivo, 'utf8'));
  } catch {
    return padrao;
  }
}

const arquivoDe = (produtoId) => path.join(DIR_SNAPSHOTS, `${produtoId}.json`);

export function salvarSnapshot(produtoId, resultado) {
  gravar(arquivoDe(produtoId), resultado);
  registrarHistorico(produtoId, resultado);
}

export function lerSnapshot(produtoId) {
  return ler(arquivoDe(produtoId));
}

export function listarSnapshots() {
  garantirPastas();
  return fs.readdirSync(DIR_SNAPSHOTS)
    .filter((n) => n.endsWith('.json'))
    .map((n) => ler(path.join(DIR_SNAPSHOTS, n)))
    .filter(Boolean);
}

export function snapshotValido(produtoId, ttlMinutos) {
  const snap = lerSnapshot(produtoId);
  if (!snap?.atualizadoEm) return null;
  const idadeMin = (Date.now() - new Date(snap.atualizadoEm).getTime()) / 60000;
  return idadeMin <= ttlMinutos ? snap : null;
}

/** Serie historica da mediana - permite ver se o item esta subindo ou caindo. */
function registrarHistorico(produtoId, resultado) {
  if (!resultado?.estatisticas?.mediana) return;
  const historico = ler(ARQ_HISTORICO, {});
  const serie = historico[produtoId] || [];
  const hoje = new Date().toISOString().slice(0, 10);

  const ponto = {
    data: hoje,
    mediana: Math.round(resultado.estatisticas.mediana),
    p25: Math.round(resultado.estatisticas.p25),
    p75: Math.round(resultado.estatisticas.p75),
    n: resultado.estatisticas.n,
  };

  const existente = serie.findIndex((p) => p.data === hoje);
  if (existente >= 0) serie[existente] = ponto;
  else serie.push(ponto);

  historico[produtoId] = serie.slice(-180); // ~6 meses
  gravar(ARQ_HISTORICO, historico);
}

export function lerHistorico(produtoId = null) {
  const historico = ler(ARQ_HISTORICO, {});
  return produtoId ? (historico[produtoId] || []) : historico;
}

/** Variacao percentual da mediana em relacao a N dias atras. */
export function tendencia(produtoId, dias = 14) {
  const serie = lerHistorico(produtoId);
  if (serie.length < 2) return null;
  const atual = serie[serie.length - 1];
  const alvo = new Date(Date.now() - dias * 86400000).toISOString().slice(0, 10);
  const anterior = [...serie].reverse().find((p) => p.data <= alvo) || serie[0];
  if (!anterior || anterior.mediana === atual.mediana) return null;
  return {
    de: anterior.mediana,
    para: atual.mediana,
    variacao: (atual.mediana - anterior.mediana) / anterior.mediana,
    dias,
  };
}
