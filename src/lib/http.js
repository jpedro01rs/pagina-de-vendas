import config from '../config.js';
import { comLimite, dormir } from './limitador.js';

export class ErroDeColeta extends Error {
  constructor(mensagem, { status = null, bloqueado = false } = {}) {
    super(mensagem);
    this.name = 'ErroDeColeta';
    this.status = status;
    this.bloqueado = bloqueado;
  }
}

const CABECALHOS_BASE = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

/** Paginas de desafio anti-bot costumam ser curtas e conter estas marcas. */
export function pareceDesafio(html) {
  if (!html) return true;
  if (html.length < 1500) return true;
  return /(captcha|cf-browser-verification|Just a moment|Attention Required|DataDome|_Incapsula_|Access Denied|Request unsuccessful)/i.test(html);
}

/** GET com headers realistas, timeout, retry com backoff e limite por host. */
export async function buscar(url, opcoes = {}) {
  const { json = false, cabecalhos = {}, tentativas = config.coleta.tentativas } = opcoes;
  const host = new URL(url).host;

  let ultimoErro;
  for (let tentativa = 0; tentativa <= tentativas; tentativa++) {
    try {
      return await comLimite(host, async () => {
        const controlador = new AbortController();
        const timer = setTimeout(() => controlador.abort(), config.coleta.timeoutMs);
        try {
          const resposta = await fetch(url, {
            redirect: 'follow',
            signal: controlador.signal,
            headers: {
              ...CABECALHOS_BASE,
              ...(json ? { Accept: 'application/json, text/plain, */*' } : {}),
              'User-Agent': config.coleta.userAgent,
              ...cabecalhos,
            },
          });

          if (resposta.status === 403 || resposta.status === 429 || resposta.status === 503) {
            throw new ErroDeColeta(`HTTP ${resposta.status} em ${host}`, { status: resposta.status, bloqueado: true });
          }
          if (!resposta.ok) {
            throw new ErroDeColeta(`HTTP ${resposta.status} em ${host}`, { status: resposta.status });
          }

          const corpo = await resposta.text();
          if (json) {
            try {
              return JSON.parse(corpo);
            } catch {
              throw new ErroDeColeta(`Resposta nao e JSON valido em ${host}`, { bloqueado: pareceDesafio(corpo) });
            }
          }
          return corpo;
        } finally {
          clearTimeout(timer);
        }
      });
    } catch (erro) {
      ultimoErro = erro;
      const ehAbort = erro?.name === 'AbortError';
      if (tentativa < tentativas) {
        await dormir(1000 * Math.pow(2, tentativa));
        continue;
      }
      if (ehAbort) throw new ErroDeColeta(`Tempo esgotado em ${host}`, { bloqueado: false });
      throw erro;
    }
  }
  throw ultimoErro;
}
