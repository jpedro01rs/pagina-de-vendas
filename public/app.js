'use strict';

/* ===================== utilidades ===================== */

const $ = (seletor) => document.querySelector(seletor);
const $$ = (seletor) => [...document.querySelectorAll(seletor)];

const dinheiro = (v) => (v == null || !Number.isFinite(v))
  ? '—'
  : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const porcento = (v) => (v == null || !Number.isFinite(v)) ? '—' : `${(v * 100).toFixed(0)}%`;

const escapar = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function tempoRelativo(iso) {
  if (!iso) return 'nunca';
  const minutos = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  return `há ${Math.floor(horas / 24)}d`;
}

async function api(caminho, opcoes) {
  const resposta = await fetch(caminho, opcoes);
  const corpo = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(corpo.erro || `Erro ${resposta.status}`);
  return corpo;
}

const estado = { config: null, tabela: [], ordem: { campo: 'oportunidades', desc: true }, oportunidades: [] };

/* ===================== abas ===================== */

$$('nav button').forEach((botao) => {
  botao.onclick = () => {
    $$('nav button').forEach((b) => b.classList.toggle('ativo', b === botao));
    $$('.aba').forEach((a) => a.classList.toggle('ativa', a.id === `aba-${botao.dataset.aba}`));
    if (botao.dataset.aba === 'oportunidades') carregarOportunidades();
  };
});

/* ===================== configuração ===================== */

async function carregarConfig() {
  estado.config = await api('/api/config');
  const { regiao, negocio, fontes, navegador, categorias, totalProdutos, coleta } = estado.config;

  $('#rotuloRegiao').textContent = regiao.cidade
    ? `· ${regiao.cidade}${regiao.uf ? '/' + regiao.uf.toUpperCase() : ''}`
    : '· região não configurada';

  if (regiao.uf) $('#campoUf').value = regiao.uf.toUpperCase();
  if (regiao.cidade) $('#campoCidade').value = regiao.cidade;

  for (const seletor of ['#filtroCategoria', '#filtroCategoriaOp']) {
    $(seletor).innerHTML = '<option value="">Todas as categorias</option>'
      + categorias.map((c) => `<option>${escapar(c)}</option>`).join('');
  }

  const ativas = fontes.filter((f) => f.ativa);
  $('#painelConfig').innerHTML = [
    cartao('Produtos monitorados', totalProdutos, 'no catálogo'),
    cartao('Fontes ativas', ativas.length, ativas.map((f) => f.nome).join(', ') || 'nenhuma'),
    cartao('Navegador', navegador ? 'Instalado' : 'Ausente',
      navegador ? 'contorna bloqueio anti-robô' : 'rode: npm run navegador'),
    cartao('ROI mínimo', porcento(negocio.roiMinimo), `lucro mínimo ${dinheiro(negocio.lucroMinimo)}`),
  ].join('');

  $('#detalheConfig').innerHTML = [
    ['Sua cidade', regiao.cidade || 'não definida'],
    ['Estado (UF)', regiao.uf ? regiao.uf.toUpperCase() : 'não definido'],
    ['Região OLX', regiao.slug || 'estado inteiro'],
    ['Desconto para venda rápida', porcento(negocio.descontoVendaRapida)],
    ['Custo fixo por operação', dinheiro(negocio.custoFixo)],
    ['Taxa da plataforma na venda', porcento(negocio.taxaPlataforma)],
    ['Lucro mínimo para virar oportunidade', dinheiro(negocio.lucroMinimo)],
    ['ROI mínimo', porcento(negocio.roiMinimo)],
    ['Páginas coletadas por busca', coleta.maxPaginas],
    ['Validade do cache', `${coleta.cacheMin} minutos`],
  ].map(([r, v]) => `<div class="linha-config"><span>${escapar(r)}</span><b>${escapar(v)}</b></div>`).join('');

  $('#listaFontes').innerHTML = fontes.map((f) =>
    `<span class="etiqueta ${f.ativa ? 'verde' : 'neutra'}">${escapar(f.nome)} · ${f.ativa ? 'ligada' : 'desligada'}</span>`).join('');

  preencherFormulario(estado.config);
}

/* ---- formulário de configuração ---- */

function preencherFormulario({ regiao, negocio, fontes, coleta }) {
  $('#cfgUf').value = (regiao.uf || '').toUpperCase();
  $('#cfgCidade').value = regiao.cidade || '';
  $('#cfgRegiao').value = regiao.slug || '';
  $('#cfgDesconto').value = Math.round(negocio.descontoVendaRapida * 100);
  $('#cfgCusto').value = negocio.custoFixo;
  $('#cfgTaxa').value = Math.round(negocio.taxaPlataforma * 100);
  $('#cfgLucro').value = negocio.lucroMinimo;
  $('#cfgRoi').value = Math.round(negocio.roiMinimo * 100);
  $('#cfgPaginas').value = coleta.maxPaginas;
  $('#cfgOlx').checked = !!fontes.find((f) => f.id === 'olx')?.ativa;
  $('#cfgEnjoei').checked = !!fontes.find((f) => f.id === 'enjoei')?.ativa;
  $('#cfgFacebook').checked = !!fontes.find((f) => f.id === 'facebook')?.ativa;
}

const numeroDoCampo = (seletor, divisor = 1) => {
  const v = Number($(seletor).value);
  return Number.isFinite(v) ? v / divisor : undefined;
};

$('#btnSalvarConfig').onclick = async () => {
  const botao = $('#btnSalvarConfig');
  botao.disabled = true;
  $('#statusConfig').textContent = '';

  try {
    await api('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        regiao: {
          uf: $('#cfgUf').value.trim().toLowerCase(),
          cidade: $('#cfgCidade').value.trim(),
          slug: $('#cfgRegiao').value.trim().toLowerCase(),
        },
        negocio: {
          descontoVendaRapida: numeroDoCampo('#cfgDesconto', 100),
          custoFixo: numeroDoCampo('#cfgCusto'),
          taxaPlataforma: numeroDoCampo('#cfgTaxa', 100),
          lucroMinimo: numeroDoCampo('#cfgLucro'),
          roiMinimo: numeroDoCampo('#cfgRoi', 100),
        },
        fontes: {
          olx: $('#cfgOlx').checked,
          enjoei: $('#cfgEnjoei').checked,
          facebook: $('#cfgFacebook').checked,
        },
        coleta: { maxPaginas: numeroDoCampo('#cfgPaginas') },
      }),
    });

    await carregarConfig();
    $('#statusConfig').textContent = 'Salvo. Já vale para as próximas buscas.';
    setTimeout(() => { $('#statusConfig').textContent = ''; }, 4000);
  } catch (erro) {
    $('#statusConfig').style.color = 'var(--vermelho)';
    $('#statusConfig').textContent = erro.message;
  } finally {
    botao.disabled = false;
  }
};

const cartao = (rotulo, valor, nota, classe = '') =>
  `<div class="cartao ${classe}"><div class="rotulo">${escapar(rotulo)}</div>
   <div class="valor">${escapar(valor)}</div><div class="nota">${escapar(nota ?? '')}</div></div>`;

/* ===================== tabela de preços ===================== */

async function carregarTabela() {
  const dados = await api('/api/tabela');
  estado.tabela = dados.linhas;
  desenharResumo();
  desenharTabela();
  acompanharAtualizacao(dados.atualizacao);
}

function desenharResumo() {
  const comDados = estado.tabela.filter((l) => !l.semDados);
  const totalOportunidades = comDados.reduce((s, l) => s + (l.oportunidades || 0), 0);
  const melhor = comDados
    .filter((l) => l.melhorOportunidade)
    .sort((a, b) => b.melhorOportunidade.lucro - a.melhorOportunidade.lucro)[0];
  const maisRecente = comDados.map((l) => l.atualizadoEm).filter(Boolean).sort().pop();

  $('#resumoTabela').innerHTML = [
    cartao('Produtos com preço', `${comDados.length}/${estado.tabela.length}`, 'já coletados'),
    cartao('Oportunidades abertas', totalOportunidades, 'abaixo do teto de compra'),
    melhor
      ? cartao('Melhor lucro agora', dinheiro(melhor.melhorOportunidade.lucro), melhor.nome, 'destaque')
      : cartao('Melhor lucro agora', '—', 'nenhuma oportunidade ainda'),
    cartao('Última coleta', tempoRelativo(maisRecente), maisRecente ? new Date(maisRecente).toLocaleString('pt-BR') : 'rode "Atualizar tabela"'),
  ].join('');
}

function linhasVisiveis() {
  const texto = $('#filtroTabela').value.trim().toLowerCase();
  const categoria = $('#filtroCategoria').value;
  const modo = $('#filtroDados').value;

  let linhas = estado.tabela;
  if (texto) linhas = linhas.filter((l) => l.nome.toLowerCase().includes(texto));
  if (categoria) linhas = linhas.filter((l) => l.categoria === categoria);
  if (modo === 'comDados') linhas = linhas.filter((l) => !l.semDados);

  const { campo, desc } = estado.ordem;
  return [...linhas].sort((a, b) => {
    let va = campo === 'confianca' ? (a.confianca?.n ?? 0) : a[campo];
    let vb = campo === 'confianca' ? (b.confianca?.n ?? 0) : b[campo];
    if (campo === 'nome') return desc ? String(vb).localeCompare(va) : String(va).localeCompare(vb);
    va = Number.isFinite(va) ? va : -1;
    vb = Number.isFinite(vb) ? vb : -1;
    return desc ? vb - va : va - vb;
  });
}

function desenharTabela() {
  const linhas = linhasVisiveis();
  const corpo = $('#tabelaPrecos tbody');

  if (!linhas.length) {
    corpo.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:44px;color:var(--texto-3)">
      Nenhum produto com preço coletado ainda. Clique em <b>Atualizar tabela</b> para buscar nos marketplaces.
    </td></tr>`;
    return;
  }

  corpo.innerHTML = linhas.map((l) => {
    if (l.semDados) {
      return `<tr data-id="${l.produtoId}">
        <td><span class="nome-produto apagado">${escapar(l.nome)}</span><span class="sub">${escapar(l.categoria)}</span></td>
        <td colspan="8" class="apagado" style="text-align:center">sem dados coletados</td>
        <td><span class="etiqueta neutra">—</span></td></tr>`;
    }
    const conf = l.confianca?.nivel;
    const corConf = conf === 'alta' ? 'verde' : conf === 'media' ? 'ambar' : 'vermelha';
    const seta = l.tendencia
      ? `<span class="${l.tendencia.variacao > 0 ? 'verde' : 'vermelho'}" title="variação em ${l.tendencia.dias} dias">
           ${l.tendencia.variacao > 0 ? '▲' : '▼'} ${porcento(Math.abs(l.tendencia.variacao))}</span>`
      : '';

    return `<tr data-id="${l.produtoId}">
      <td><span class="nome-produto">${escapar(l.nome)}</span><span class="sub">${escapar(l.categoria)} · ${tempoRelativo(l.atualizadoEm)} ${seta}</span></td>
      <td>${l.n}</td>
      <td class="apagado">${dinheiro(l.min)}</td>
      <td>${dinheiro(l.p25)}</td>
      <td class="destaque-mediana">${dinheiro(l.mediana)}</td>
      <td>${dinheiro(l.p75)}</td>
      <td class="verde"><b>${dinheiro(l.tetoDeCompra)}</b></td>
      <td class="azul">${dinheiro(l.precoVendaRapida)}</td>
      <td>${l.oportunidades ? `<span class="etiqueta verde">${l.oportunidades}</span>` : '<span class="apagado">0</span>'}</td>
      <td><span class="etiqueta ${corConf}">${escapar(l.confianca.rotulo)}</span></td>
    </tr>`;
  }).join('');

  corpo.querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.onclick = () => abrirProduto(tr.dataset.id);
  });

  desenharCartoesDePreco(linhas);
}

/**
 * No celular a tabela de 10 colunas nao serve. Renderizamos os mesmos dados
 * como cartoes, destacando os tres numeros que decidem a compra.
 * O CSS escolhe qual dos dois aparece.
 */
function desenharCartoesDePreco(linhas) {
  const alvo = $('#cartoesPrecos');
  if (!linhas.length) { alvo.innerHTML = ''; return; }

  alvo.innerHTML = linhas.map((l) => {
    if (l.semDados) {
      return `<div class="preco-cartao vazio-cartao" data-id="${l.produtoId}">
        <div class="pc-nome">${escapar(l.nome)}<span class="sub">${escapar(l.categoria)} · sem dados</span></div>
      </div>`;
    }
    const conf = l.confianca?.nivel;
    const corConf = conf === 'alta' ? 'verde' : conf === 'media' ? 'ambar' : 'vermelha';
    return `<div class="preco-cartao" data-id="${l.produtoId}">
      <div class="pc-topo">
        <div class="pc-nome">${escapar(l.nome)}
          <span class="sub">${escapar(l.categoria)} · ${l.n} anúncios · ${tempoRelativo(l.atualizadoEm)}</span>
        </div>
        ${l.oportunidades ? `<span class="etiqueta verde">${l.oportunidades} oport.</span>` : `<span class="etiqueta ${corConf}">${escapar(l.confianca.rotulo)}</span>`}
      </div>
      <div class="pc-numeros">
        <div><span class="r">Mercado</span><b>${dinheiro(l.mediana)}</b></div>
        <div><span class="r">Pague até</span><b class="verde">${dinheiro(l.tetoDeCompra)}</b></div>
        <div><span class="r">Venda por</span><b class="azul">${dinheiro(l.precoVendaRapida)}</b></div>
      </div>
    </div>`;
  }).join('');

  alvo.querySelectorAll('[data-id]').forEach((el) => {
    el.onclick = () => abrirProduto(el.dataset.id);
  });
}

$$('#tabelaPrecos thead th').forEach((th) => {
  th.onclick = () => {
    const campo = th.dataset.ordenar;
    estado.ordem = { campo, desc: estado.ordem.campo === campo ? !estado.ordem.desc : true };
    $$('#tabelaPrecos thead th .seta').forEach((s) => { s.textContent = ''; });
    th.querySelector('.seta').textContent = estado.ordem.desc ? '▼' : '▲';
    desenharTabela();
  };
});

['#filtroTabela', '#filtroCategoria', '#filtroDados'].forEach((seletor) => {
  $(seletor).addEventListener('input', desenharTabela);
});

/* ===================== atualização do catálogo ===================== */

async function dispararAtualizacao(corpo) {
  const botoes = [$('#btnAtualizar'), $('#btnAtualizarCategoria')];
  botoes.forEach((b) => { b.disabled = true; });
  try {
    await api('/api/atualizar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo || {}),
    });
    vigiarProgresso();
  } catch (erro) {
    $('#statusAtualizacao').textContent = erro.message;
    botoes.forEach((b) => { b.disabled = false; });
  }
}

$('#btnAtualizar').onclick = () => {
  if (!confirm('Isso vai consultar os marketplaces para todos os produtos do catálogo e pode levar vários minutos. Continuar?')) return;
  dispararAtualizacao({});
};

$('#btnAtualizarCategoria').onclick = () => {
  const categoria = $('#filtroCategoria').value;
  if (!categoria) return alert('Escolha uma categoria no filtro primeiro.');
  dispararAtualizacao({ categoria });
};

let temporizador = null;
function vigiarProgresso() {
  clearInterval(temporizador);
  temporizador = setInterval(async () => {
    const estadoJob = await api('/api/atualizar/status').catch(() => null);
    if (!estadoJob) return;
    acompanharAtualizacao(estadoJob);
    if (!estadoJob.emAndamento) {
      clearInterval(temporizador);
      [$('#btnAtualizar'), $('#btnAtualizarCategoria')].forEach((b) => { b.disabled = false; });
      await carregarTabela();
    }
  }, 1500);
}

function acompanharAtualizacao(job) {
  if (!job || job.nunca) { $('#statusAtualizacao').textContent = ''; $('#barraProgresso').innerHTML = ''; return; }

  if (job.emAndamento) {
    const pct = job.total ? (job.concluidos / job.total) * 100 : 0;
    $('#statusAtualizacao').innerHTML = `<span class="carregando"></span> ${job.concluidos}/${job.total} — ${escapar(job.atual || '')}`;
    $('#barraProgresso').innerHTML = `<div class="progresso"><div style="width:${pct}%"></div></div>`;
    [$('#btnAtualizar'), $('#btnAtualizarCategoria')].forEach((b) => { b.disabled = true; });
  } else {
    $('#barraProgresso').innerHTML = '';
    $('#statusAtualizacao').textContent = job.terminadoEm
      ? `Concluído: ${job.comDados} com preço, ${job.comErro} com erro.` : '';
  }
}

/* ===================== busca livre ===================== */

$('#btnBuscar').onclick = buscarTermo;
$('#campoBusca').addEventListener('keydown', (e) => { if (e.key === 'Enter') buscarTermo(); });

async function buscarTermo() {
  const termo = $('#campoBusca').value.trim();
  if (termo.length < 2) return;

  const alvo = $('#resultadoBusca');
  alvo.innerHTML = `<div class="vazio"><span class="carregando"></span>
    <p style="margin-top:14px">Consultando os marketplaces ao vivo. Isso leva de 10 a 60 segundos.</p></div>`;

  const parametros = new URLSearchParams({ q: termo, atualizar: 'true' });
  if ($('#campoUf').value.trim()) parametros.set('uf', $('#campoUf').value.trim().toLowerCase());
  if ($('#campoCidade').value.trim()) parametros.set('cidade', $('#campoCidade').value.trim());

  try {
    const resultado = await api(`/api/buscar?${parametros}`);
    alvo.innerHTML = montarRelatorio(resultado);
    ligarCliquesDeAnuncio(alvo);
  } catch (erro) {
    alvo.innerHTML = `<div class="aviso-caixa alerta"><b>A busca falhou:</b> ${escapar(erro.message)}
      <br><br>Rode <code>npm run doctor</code> no terminal para ver qual fonte está bloqueada.</div>`;
  }
}

/* ===================== relatório de um produto ===================== */

function montarRelatorio(r) {
  const e = r.estatisticas;
  const problemas = r.fontes.filter((f) => !f.ok);

  const avisoFontes = problemas.length
    ? `<div class="aviso-caixa alerta" style="margin-bottom:16px"><b>Fonte com problema:</b>
       ${problemas.map((f) => `${escapar(f.nome)} — ${escapar(f.erro || 'sem retorno')}`).join('<br>')}</div>`
    : '';

  if (!e || !e.suficiente) {
    return `${avisoFontes}<div class="vazio"><h3>Amostra insuficiente para calcular preço</h3>
      <p>Foram encontrados ${r.coletados} anúncios e apenas <b>${r.analisados}</b> passaram no filtro de relevância —
      pouco para uma mediana confiável.</p>
      <p style="font-size:12.5px">Descartados: ${escapar(Object.entries(r.motivosDescarte || {}).map(([m, q]) => `${m} (${q})`).join(', ') || 'nenhum')}</p></div>`;
  }

  const arb = r.arbitragem;

  return `
  ${avisoFontes}
  <div class="painel">
    ${cartao('Preço de mercado', dinheiro(e.mediana), `mediana de ${e.n} anúncios`, 'destaque')}
    ${cartao('Pague no máximo', dinheiro(r.tetoDeCompra), 'para bater seu ROI mínimo')}
    ${cartao('Venda rápida por', dinheiro(r.precoVendaRapida), 'um pouco abaixo do mercado')}
    ${cartao('Oportunidades', r.oportunidades.length, `de ${r.analisados} anúncios válidos`)}
  </div>

  <div class="regua">
    <div class="regua-barra"></div>
    <div class="regua-marcas">
      <div>Mínimo<b>${dinheiro(e.min)}</b></div>
      <div>P25<b>${dinheiro(e.p25)}</b></div>
      <div>Mediana<b>${dinheiro(e.mediana)}</b></div>
      <div>P75<b>${dinheiro(e.p75)}</b></div>
      <div>Máximo<b>${dinheiro(e.max)}</b></div>
    </div>
  </div>

  <div class="aviso-caixa">
    <b>Como ler:</b> comprar abaixo de <b>${dinheiro(e.p25)}</b> (P25) é comprar mais barato que 75% do mercado.
    Anunciar em <b>${dinheiro(r.precoVendaRapida)}</b> deixa você abaixo da mediana, que é o que faz girar rápido.
    Confiança da amostra: <b>${escapar(e.confianca.rotulo)}</b> (${e.n} anúncios, ${e.outliersRemovidos} descartados como preço fora da curva).
  </div>

  ${arb ? `<div class="aviso-caixa" style="margin-top:12px;border-left-color:var(--roxo)">
    <b>Arbitragem entre plataformas:</b> a mediana no <b>${escapar(arb.comprarEm)}</b> é ${dinheiro(arb.medianaCompra)}
    e no <b>${escapar(arb.venderEm)}</b> é ${dinheiro(arb.medianaVenda)}.
    Comprar num e vender no outro abre <b>${dinheiro(arb.diferenca)}</b> (${porcento(arb.percentual)}) de diferença.
  </div>` : ''}

  ${quebras(e)}

  <h2>Oportunidades de compra (${r.oportunidades.length})</h2>
  ${r.oportunidades.length
    ? `<div class="grade-oportunidades">${r.oportunidades.map((o) => cartaoOportunidade(o, r.nome)).join('')}</div>`
    : `<div class="aviso-caixa">Nenhum anúncio abaixo do teto de <b>${dinheiro(r.tetoDeCompra)}</b> no momento.
       O mercado está equilibrado para este item — vale voltar depois.</div>`}

  <h2>Todos os anúncios válidos (${r.anuncios.length})</h2>
  <div class="moldura-tabela"><table><thead><tr>
    <th style="text-align:left">Anúncio</th><th>Preço</th><th>vs. mercado</th><th>Local</th><th>Fonte</th>
  </tr></thead><tbody>
  ${r.anuncios.map((a) => {
    const dif = (a.preco - e.mediana) / e.mediana;
    const cor = dif < -0.1 ? 'verde' : dif > 0.1 ? 'vermelho' : 'apagado';
    return `<tr data-url="${escapar(a.url || '')}">
      <td style="text-align:left"><span class="nome-produto">${escapar(a.titulo)}</span></td>
      <td><b>${dinheiro(a.preco)}</b></td>
      <td class="${cor}">${dif > 0 ? '+' : ''}${porcento(dif)}</td>
      <td class="apagado">${escapar(a.cidade || '—')}${a.uf ? '/' + escapar(a.uf) : ''}</td>
      <td><span class="etiqueta neutra">${escapar(a.fonte)}</span></td>
    </tr>`;
  }).join('')}
  </tbody></table></div>

  <p style="color:var(--texto-3);font-size:12px;margin-top:14px">
    Coletados ${r.coletados} anúncios, ${r.analisados} válidos, ${r.descartados} descartados pelo filtro
    (${escapar(Object.entries(r.motivosDescarte || {}).slice(0, 4).map(([m, q]) => `${m}: ${q}`).join(' · ') || '—')}).
    Consulta feita ${tempoRelativo(r.atualizadoEm)}${r.doCache ? ' (do cache)' : ''}.
  </p>`;
}

function quebras(e) {
  const bloco = (titulo, dados, formatar = (k) => k) => {
    const itens = Object.entries(dados || {}).filter(([, v]) => v.n >= 2);
    if (itens.length < 2) return '';
    return `<h3>${escapar(titulo)}</h3><div class="painel">
      ${itens.map(([k, v]) => cartao(formatar(k), dinheiro(v.mediana), `${v.n} anúncios`)).join('')}</div>`;
  };
  return bloco('Preço por plataforma', e.porFonte)
    + bloco('Preço por armazenamento', e.porArmazenamento)
    + bloco('Preço por estado do produto', e.porCondicao);
}

function cartaoOportunidade(o, nomeProduto) {
  const avisoHtml = o.aviso
    ? `<div class="op-aviso ${o.risco === 'alto' ? 'grave' : ''}">${escapar(o.aviso)}</div>` : '';
  return `<div class="oportunidade risco-${o.risco}">
    <div class="op-topo">
      <div>
        <div class="op-produto">${escapar(o.produto || nomeProduto || '')}</div>
        <div class="op-titulo">${escapar(o.titulo)}</div>
      </div>
      <div class="op-score"><b class="${o.score >= 80 ? 'verde' : o.score >= 60 ? 'ambar' : ''}">${o.score}</b><small>score</small></div>
    </div>
    <div class="op-numeros">
      <div><div class="r">Compra</div><div class="v">${dinheiro(o.precoCompra)}</div></div>
      <div><div class="r">Venda</div><div class="v azul">${dinheiro(o.precoVendaRapida)}</div></div>
      <div><div class="r">Lucro</div><div class="v verde">${dinheiro(o.lucro)}</div></div>
    </div>
    <div class="op-rodape">
      <span>ROI <b class="verde">${porcento(o.roi)}</b> · ${porcento(o.desconto)} abaixo do mercado</span>
      <span>${o.perto ? '<span class="etiqueta azul">perto de você</span>' : escapar(o.cidade || '')}</span>
    </div>
    ${avisoHtml}
    <div class="op-rodape">
      <span class="etiqueta neutra">${escapar(o.fonte)}</span>
      ${o.url ? `<a class="link" href="${escapar(o.url)}" target="_blank" rel="noopener">Abrir anúncio →</a>` : ''}
    </div>
  </div>`;
}

function ligarCliquesDeAnuncio(raiz) {
  raiz.querySelectorAll('tr[data-url]').forEach((tr) => {
    if (!tr.dataset.url) return;
    tr.onclick = () => window.open(tr.dataset.url, '_blank', 'noopener');
  });
}

/* ===================== gaveta de detalhe ===================== */

async function abrirProduto(id) {
  const linha = estado.tabela.find((l) => l.produtoId === id);
  $('#gavetaTitulo').textContent = linha?.nome || id;
  $('#gavetaSub').textContent = 'carregando...';
  $('#gavetaCorpo').innerHTML = '<div class="vazio"><span class="carregando"></span></div>';
  $('#gaveta').classList.add('aberta');
  $('#cortina').classList.add('aberta');

  try {
    const resultado = await api(`/api/produto/${encodeURIComponent(id)}`);
    $('#gavetaSub').textContent = `${resultado.analisados} anúncios válidos · atualizado ${tempoRelativo(resultado.atualizadoEm)}`;
    $('#gavetaCorpo').innerHTML = `
      <div class="ferramentas"><button class="botao secundario" id="btnRefazer">Consultar de novo agora</button></div>
      ${montarRelatorio(resultado)}`;
    ligarCliquesDeAnuncio($('#gavetaCorpo'));
    $('#btnRefazer').onclick = async () => {
      $('#gavetaCorpo').innerHTML = '<div class="vazio"><span class="carregando"></span><p style="margin-top:14px">Consultando ao vivo...</p></div>';
      const novo = await api(`/api/produto/${encodeURIComponent(id)}?atualizar=true`).catch((e) => ({ erro: e.message }));
      if (novo.erro) { $('#gavetaCorpo').innerHTML = `<div class="aviso-caixa alerta">${escapar(novo.erro)}</div>`; return; }
      $('#gavetaCorpo').innerHTML = montarRelatorio(novo);
      ligarCliquesDeAnuncio($('#gavetaCorpo'));
      carregarTabela();
    };
  } catch (erro) {
    $('#gavetaCorpo').innerHTML = `<div class="aviso-caixa alerta">${escapar(erro.message)}</div>`;
  }
}

function fecharGaveta() {
  $('#gaveta').classList.remove('aberta');
  $('#cortina').classList.remove('aberta');
}
$('#btnFechar').onclick = fecharGaveta;
$('#cortina').onclick = fecharGaveta;
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharGaveta(); });

/* ===================== oportunidades ===================== */

async function carregarOportunidades() {
  const alvo = $('#listaOportunidades');
  alvo.innerHTML = '<div class="vazio"><span class="carregando"></span></div>';
  try {
    const { oportunidades } = await api(`/api/oportunidades?risco=${$('#filtroRisco').value}&limite=120`);
    estado.oportunidades = oportunidades;
    desenharOportunidades();
  } catch (erro) {
    alvo.innerHTML = `<div class="aviso-caixa alerta">${escapar(erro.message)}</div>`;
  }
}

function desenharOportunidades() {
  const categoria = $('#filtroCategoriaOp').value;
  const lucroMinimo = Number($('#filtroLucro').value) || 0;
  let lista = estado.oportunidades;
  if (categoria) lista = lista.filter((o) => o.categoria === categoria);
  if (lucroMinimo) lista = lista.filter((o) => o.lucro >= lucroMinimo);

  const alvo = $('#listaOportunidades');
  if (!lista.length) {
    alvo.innerHTML = `<div class="vazio"><h3>Nenhuma oportunidade no momento</h3>
      <p>Ou o catálogo ainda não foi coletado, ou não há anúncio abaixo do seu teto de compra.
      Vá em <b>Tabela de preços</b> e clique em <b>Atualizar tabela</b>.</p></div>`;
    return;
  }

  const lucroTotal = lista.reduce((s, o) => s + o.lucro, 0);
  const investimento = lista.reduce((s, o) => s + o.investimento, 0);
  alvo.innerHTML = `<div class="painel">
      ${cartao('Oportunidades', lista.length, 'dentro dos seus filtros')}
      ${cartao('Lucro somado', dinheiro(lucroTotal), 'se comprasse todas', 'destaque')}
      ${cartao('Capital necessário', dinheiro(investimento), 'compra + custos')}
      ${cartao('ROI médio', porcento(investimento ? lucroTotal / investimento : 0), 'sobre o capital')}
    </div>
    <div class="grade-oportunidades">${lista.map((o) => cartaoOportunidade(o)).join('')}</div>`;
}

['#filtroCategoriaOp', '#filtroLucro'].forEach((s) => $(s).addEventListener('input', desenharOportunidades));
$('#filtroRisco').addEventListener('change', carregarOportunidades);
$('#btnRecarregarOp').onclick = carregarOportunidades;

/* ===================== app instalado / offline ===================== */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* sem HTTPS ou sem suporte */ });
  });
}

// Avisa quando os dados na tela vieram do cache, sem rede.
window.addEventListener('offline', () => mostrarAvisoDeRede(true));
window.addEventListener('online', () => mostrarAvisoDeRede(false));

function mostrarAvisoDeRede(offline) {
  let barra = $('#avisoRede');
  if (!offline) { barra?.remove(); return; }
  if (barra) return;
  barra = document.createElement('div');
  barra.id = 'avisoRede';
  barra.className = 'aviso-rede';
  barra.textContent = 'Sem conexão — mostrando os últimos preços salvos';
  document.body.appendChild(barra);
}

/* ===================== início ===================== */

(async function iniciar() {
  // O evento 'offline' so dispara na transicao: no carregamento e preciso perguntar.
  mostrarAvisoDeRede(!navigator.onLine);
  try {
    await carregarConfig();
    await carregarTabela();
  } catch (erro) {
    document.querySelector('main').innerHTML =
      `<div class="aviso-caixa alerta">Não consegui falar com o servidor: ${escapar(erro.message)}</div>`;
  }
})();
