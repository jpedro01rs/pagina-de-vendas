import config from '../config.js';

/**
 * Fila por host: garante intervalo minimo entre requisicoes ao mesmo dominio.
 * Evita bloqueio e mantem a coleta educada.
 */
const filas = new Map();

export async function comLimite(host, tarefa) {
  const anterior = filas.get(host) || Promise.resolve();
  let liberar;
  const atual = new Promise((r) => { liberar = r; });
  filas.set(host, anterior.then(() => atual));

  await anterior;
  try {
    return await tarefa();
  } finally {
    const jitter = Math.floor(Math.random() * 500);
    setTimeout(liberar, config.coleta.delayMs + jitter);
  }
}

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
