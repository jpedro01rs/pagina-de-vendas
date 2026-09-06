import crypto from 'node:crypto';
import config from '../config.js';

/**
 * Protecao por senha, opcional.
 *
 * Na sua rede de casa nao e necessaria. Passa a ser quando voce expoe o app
 * para fora (tunel), porque senao qualquer um com o endereco usa a sua coleta.
 * Ligue definindo SENHA no .env.
 */

const NOME_COOKIE = 'radar_sessao';

/** O cookie guarda um HMAC da senha, nunca a senha em si. */
function fichaEsperada() {
  return crypto.createHmac('sha256', config.senha).update('revenda-radar-v1').digest('hex');
}

function lerCookie(cabecalho, nome) {
  if (!cabecalho) return null;
  for (const parte of cabecalho.split(';')) {
    const [chave, ...resto] = parte.trim().split('=');
    if (chave === nome) return decodeURIComponent(resto.join('='));
  }
  return null;
}

function iguais(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function estaAutenticado(req) {
  if (!config.senha) return true;
  const ficha = lerCookie(req.headers.cookie, NOME_COOKIE);
  return !!ficha && iguais(ficha, fichaEsperada());
}

export function entrar(res) {
  res.cookie?.(NOME_COOKIE, fichaEsperada(), {
    httpOnly: true, sameSite: 'lax', maxAge: 30 * 24 * 3600 * 1000,
  });
  // Sem cookie-parser: monta o cabecalho na mao.
  if (!res.cookie) {
    res.setHeader('Set-Cookie',
      `${NOME_COOKIE}=${fichaEsperada()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 3600}`);
  }
}

export function senhaConfere(tentativa) {
  if (!config.senha) return true;
  const a = crypto.createHash('sha256').update(String(tentativa)).digest();
  const b = crypto.createHash('sha256').update(config.senha).digest();
  return crypto.timingSafeEqual(a, b);
}

export const PAGINA_LOGIN = (erro = '') => `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Revenda Radar</title><link rel="stylesheet" href="/styles.css"></head>
<body style="display:grid;place-items:center;min-height:100vh;padding:20px">
  <form method="POST" action="/entrar" style="width:100%;max-width:330px">
    <div class="marca" style="justify-content:center;margin-bottom:22px">
      <span class="ponto"></span> Revenda Radar
    </div>
    <div class="cartao">
      <label style="display:block;font-size:12.5px;color:var(--texto-2);margin-bottom:8px">Senha de acesso</label>
      <input type="password" name="senha" autofocus autocomplete="current-password"
             style="width:100%;margin-bottom:12px" required>
      <button class="botao" type="submit" style="width:100%">Entrar</button>
      ${erro ? `<p style="color:var(--vermelho);font-size:13px;margin:12px 0 0;text-align:center">${erro}</p>` : ''}
    </div>
  </form>
</body></html>`;
