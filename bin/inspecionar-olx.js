#!/usr/bin/env node
/**
 * Abre UMA pagina da OLX e relata fatos crus sobre o que voltou.
 *
 * Existe porque a coleta trouxe 1 a 3 anuncios por pagina em vez de ~50, e
 * "a OLX bloqueou" e so uma hipotese. Este comando mede: tamanho do HTML,
 * titulo, presenca de JSON embutido, quantos links de anuncio existem e se
 * rolar a pagina muda o numero.
 *
 *   node bin/inspecionar-olx.js
 */
import { montarUrl } from '../src/sources/olx.js';
import { caminhoDeCategoria } from '../src/sources/olx-taxonomia.js';
import { buscarProduto } from '../src/catalog/index.js';
import { estadoDoNavegador, encerrarNavegador } from '../src/lib/navegador.js';
import { extrairJsonEmbutido, garimparAnuncios } from '../src/lib/extrator.js';
import { extrairCartoesDaPagina, PADRAO_ID } from '../src/lib/extrator-dom.js';
import { buscar, pareceDesafio } from '../src/lib/http.js';
import config from '../src/config.js';

const produto = buscarProduto('iphone-13');
const url = montarUrl({
  caminho: caminhoDeCategoria(produto),
  uf: config.regiao.uf || 'sp',
  regiao: config.regiao.slug || 'sao-paulo-e-regiao',
});

const linha = (r, v) => console.log(`  ${String(r).padEnd(34, '.')} ${v}`);

console.log(`\n${'='.repeat(64)}\n  O QUE A OLX DEVOLVE PARA ESTA MAQUINA\n${'='.repeat(64)}`);
console.log(`\nURL: ${url}\n`);

/* ---------- 1. requisicao HTTP simples ---------- */
console.log('-- HTTP direto --');
try {
  const html = await buscar(url);
  linha('bytes recebidos', html.length);
  linha('parece bloqueio/captcha', pareceDesafio(html));
  linha('titulo', (html.match(/<title[^>]*>([\s\S]{0,120}?)<\/title>/i)?.[1] || '(sem titulo)').trim());
  linha('tem __NEXT_DATA__', html.includes('__NEXT_DATA__'));
  const blocos = extrairJsonEmbutido(html);
  linha('blocos JSON embutidos', blocos.length);
  let achados = 0;
  for (const b of blocos) achados += garimparAnuncios(b, { fonte: 'olx', baseUrl: 'https://www.olx.com.br' }).length;
  linha('anuncios no JSON', achados);
  linha('links de anuncio no HTML', (html.match(/olx\.com\.br\/[^"']*-\d{6,}/g) || []).length);
} catch (erro) {
  linha('FALHOU', erro.message);
}

/* ---------- 2. navegador de verdade ---------- */
const nav = await estadoDoNavegador();
if (!nav.pronto) {
  console.log(`\n-- Navegador indisponivel: ${nav.mensagem}\n`);
  process.exit(0);
}

console.log('\n-- Navegador real (com rolagem) --');
const { chromium } = await import('playwright');
const navegador = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-blink-features=AutomationControlled'] });
const contexto = await navegador.newContext({
  locale: 'pt-BR', timezoneId: 'America/Sao_Paulo',
  viewport: { width: 1366, height: 900 }, userAgent: config.coleta.userAgent,
});
const pagina = await contexto.newPage();

try {
  await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

  const medir = async (rotulo) => {
    const m = await pagina.evaluate(() => ({
      bytes: document.documentElement.outerHTML.length,
      titulo: document.title,
      links: document.querySelectorAll('a[href*="olx.com.br"]').length,
      anuncios: document.querySelectorAll('a[href*="/vi/"], [data-ds-component*="AdCard"], [data-testid*="ad-card"]').length,
      precos: (document.body.innerText.match(/R\$\s?[\d.]+/g) || []).length,
      nextData: !!document.getElementById('__NEXT_DATA__'),
      texto: document.body.innerText.slice(0, 160).replace(/\s+/g, ' '),
    }));
    console.log(`\n  [${rotulo}]`);
    linha('bytes', m.bytes);
    linha('titulo', m.titulo.slice(0, 70));
    linha('tem __NEXT_DATA__', m.nextData);
    linha('links da olx', m.links);
    linha('cartoes de anuncio', m.anuncios);
    linha('precos "R$" no texto', m.precos);
    linha('inicio do texto', m.texto.slice(0, 90));
    return m;
  };

  await pagina.waitForTimeout(1500);
  const antes = await medir('logo apos carregar');

  // Rola ate o fim em etapas: se a lista carrega por rolagem, o numero sobe.
  for (let i = 0; i < 8; i++) {
    await pagina.evaluate(() => window.scrollBy(0, window.innerHeight * 1.2));
    await pagina.waitForTimeout(700);
  }
  await pagina.waitForTimeout(1500);
  const depois = await medir('apos rolar a pagina');

  console.log('\n-- Conclusao --');
  if (depois.precos > antes.precos * 1.5) {
    linha('veredito', 'a pagina carrega por rolagem: precisa rolar');
  } else if (depois.precos <= 3 && depois.bytes < 250000) {
    linha('veredito', 'pagina praticamente vazia: bloqueio provavel');
  } else if (depois.precos > 10) {
    linha('veredito', 'a pagina TEM anuncios: o extrator e que nao pega');
  } else {
    linha('veredito', 'inconclusivo');
  }

  // O que o extrator de verdade consegue tirar desta pagina.
  const cartoes = await pagina.evaluate(extrairCartoesDaPagina, { padraoId: PADRAO_ID.olx });
  console.log('\n-- O extrator do coletor --');
  linha('anuncios extraidos', cartoes.length);
  for (const c of cartoes.slice(0, 6)) {
    console.log(`     R$ ${String(c.precoTexto).padStart(8)}  ${c.titulo.slice(0, 52)}`);
  }

  // Fatos sobre a estrutura, para consertar o extrator se ainda falhar.
  const estrutura = await pagina.evaluate(() => {
    const ID = /-(\d{6,})(?:[?#/]|$)/;
    const ancoras = [...document.querySelectorAll('a[href]')];
    const deAnuncio = ancoras.filter((a) => ID.test(a.getAttribute('href') || '') || ID.test(a.href || ''));
    const comPrecoDentro = deAnuncio.filter((a) => /R\$/.test(a.innerText || ''));
    const exemplo = deAnuncio[0];
    return {
      ancoras: ancoras.length,
      deAnuncio: deAnuncio.length,
      comPrecoDentro: comPrecoDentro.length,
      exemploHref: exemplo ? exemplo.href : '(nenhuma)',
      exemploHtml: exemplo ? exemplo.outerHTML.slice(0, 400) : '',
      // Como e o ancestral de um preco: mostra onde o cartao comeca.
      voltaDoPreco: (() => {
        const alvo = [...document.querySelectorAll('*')]
          .find((el) => el.children.length === 0 && /R\$\s*[\d.]{3,}/.test(el.textContent || ''));
        if (!alvo) return '(nenhum preco isolado)';
        const caminho = [];
        let no = alvo;
        for (let i = 0; i < 5 && no; i++) {
          caminho.push(`${no.tagName.toLowerCase()}${no.className ? '.' + String(no.className).split(' ')[0] : ''}`);
          no = no.parentElement;
        }
        return caminho.join(' < ');
      })(),
    };
  });

  console.log('\n-- Estrutura da pagina --');
  linha('ancoras no total', estrutura.ancoras);
  linha('ancoras de anuncio', estrutura.deAnuncio);
  linha('com preco dentro da ancora', estrutura.comPrecoDentro);
  linha('caminho a partir do preco', estrutura.voltaDoPreco);
  console.log(`\n  exemplo de href: ${estrutura.exemploHref}`);
  console.log(`  html: ${estrutura.exemploHtml}\n`);
} catch (erro) {
  console.log(`  FALHOU: ${erro.message}`);
} finally {
  await contexto.close().catch(() => {});
  await navegador.close().catch(() => {});
  await encerrarNavegador();
}
