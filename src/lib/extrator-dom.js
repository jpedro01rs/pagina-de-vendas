/**
 * Extrator de cartoes que roda DENTRO da pagina, no navegador.
 *
 * Marketplaces geram classes com hash a cada build
 * ("SearchExpansion-module-scss-module__Fl45fa__link"), entao seletor por
 * classe e regex sobre HTML quebram sozinhos. Aqui nao dependemos de
 * estrutura: partimos dos PRECOS e subimos ate o cartao que os contem.
 *
 * Comecar pelo preco importa: na OLX o preco fica FORA da ancora, entao
 * procurar preco dentro de <a> nao encontra quase nada.
 *
 * Esta funcao e serializada para o contexto da pagina - por isso nao usa
 * nada de fora, e recebe a configuracao por argumento.
 */
export function extrairCartoesDaPagina({ padraoId, padraoPreco = 'R\\$\\s*([\\d.]+(?:,\\d{2})?)' }) {
  const ID = new RegExp(padraoId);
  const PRECO = new RegExp(padraoPreco);

  const ehLinkDeAnuncio = (a) => ID.test(a.getAttribute('href') || '') || ID.test(a.href || '');

  const elementosComPreco = [];
  const caminhante = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let no = caminhante.nextNode(); no; no = caminhante.nextNode()) {
    if (no.nodeValue && PRECO.test(no.nodeValue) && no.parentElement) {
      elementosComPreco.push(no.parentElement);
    }
  }

  const vistos = new Set();
  const saida = [];

  for (const elementoPreco of elementosComPreco) {
    const preco = (elementoPreco.textContent || '').match(PRECO);
    if (!preco) continue;

    // Sobe ate o primeiro ancestral com EXATAMENTE um link de anuncio.
    // Com mais de um ja passamos do cartao e caimos na grade: nao da para
    // saber a qual anuncio o preco pertence, entao descartamos.
    let cartao = null;
    let link = null;
    let no = elementoPreco;

    for (let nivel = 0; nivel < 10 && no && no !== document.body; nivel++) {
      const links = [...no.querySelectorAll('a[href]')].filter(ehLinkDeAnuncio);
      // O proprio no pode ser a ancora, quando o preco fica dentro do link.
      if (no.tagName === 'A' && ehLinkDeAnuncio(no) && !links.includes(no)) links.push(no);

      if (links.length === 1) { cartao = no; [link] = links; break; }
      if (links.length > 1) break;
      no = no.parentElement;
    }
    if (!cartao || !link) continue;

    const id = (link.href || '').match(ID);
    if (!id || vistos.has(id[1])) continue;

    const texto = (cartao.innerText || '').replace(/\s+/g, ' ').trim();
    const cabecalho = cartao.querySelector('h1, h2, h3, [data-testid*="title"], [class*="title" i]');
    let titulo = cabecalho ? cabecalho.innerText.trim() : '';
    if (!titulo) titulo = (link.getAttribute('title') || link.getAttribute('aria-label') || link.innerText || '').trim();
    if (!titulo) titulo = texto.slice(0, texto.indexOf(preco[0])).trim();
    titulo = titulo.replace(/\s+/g, ' ').slice(0, 140).trim();
    if (titulo.length < 4) continue;

    vistos.add(id[1]);
    saida.push({
      idExterno: id[1],
      url: link.href,
      titulo,
      precoTexto: preco[1],
      // O texto inteiro do cartao carrega cidade e selo de loja, quando existem.
      textoCartao: texto.slice(0, 400),
    });
  }
  return saida;
}

/** Identificadores de anuncio por marketplace. */
export const PADRAO_ID = {
  olx: '-(\\d{6,})(?:[?#/]|$)',
  enjoei: '/p/[^/?#]*-(\\d{5,})(?:[?#/]|$)',
  facebook: '/marketplace/item/(\\d{6,})',
};
