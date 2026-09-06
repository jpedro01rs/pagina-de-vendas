import config from '../config.js';
import * as olx from './olx.js';
import * as enjoei from './enjoei.js';
import * as facebook from './facebook.js';

export const FONTES = { olx, enjoei, facebook };

export function fontesAtivas() {
  return Object.entries(FONTES)
    .filter(([id]) => config.fontes[id])
    .map(([, modulo]) => modulo);
}

export function listarFontes() {
  return Object.entries(FONTES).map(([id, modulo]) => ({
    id, nome: modulo.NOME, ativa: !!config.fontes[id],
  }));
}
