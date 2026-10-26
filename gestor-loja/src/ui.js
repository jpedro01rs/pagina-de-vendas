/* ============================================================
   Componentes de interface: ícones, KPIs, tabelas, modais, formulários, gráficos
   ============================================================ */
const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  cart: '<path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
  register: '<rect x="3" y="11" width="18" height="10" rx="2"/><path d="M6 11V5h9v6M9 8h3M7 15h2M11 15h2M15 15h2M7 18h10"/>',
  grid: '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
  wallet: '<path d="M4 7h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h11v3"/><circle cx="16.5" cy="13.5" r="1.2"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8"/>',
  mega: '<path d="M3 10v4a1 1 0 0 0 1 1h3l8 5V4L7 9H4a1 1 0 0 0-1 1z"/><path d="M19 9a4 4 0 0 1 0 6"/>',
  badge: '<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l4 4v2h-8"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  factory: '<path d="M3 21h18M5 21V9l5 3V9l5 3V5h4v16"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3l-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>', down: '<path d="M6 9l6 6 6-6"/>',
  logout: '<path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  chat: '<path d="M4 5h16v11H8l-4 4z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  minus: '<path d="M5 12h14"/>',
};
const ic = (n, cls = '') => '<svg class="ic ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

/* ---------- glossário: o que cada indicador significa e como é calculado ---------- */
const INFO = {
  lucro: ['Lucro líquido', 'Faturamento − custos variáveis (mercadoria vendida, impostos, taxas de cartão, comissões, entregas) − despesas operacionais − perdas + outras receitas', 'Quanto sobrou de verdade no período depois de pagar tudo. É o número mais importante da loja.', 'Se estiver baixo, veja primeiro a margem de contribuição e depois as maiores despesas.'],
  fluxo: ['Fluxo de caixa', 'Entradas recebidas − saídas pagas no período, pela data em que o dinheiro entrou ou saiu', 'Diferente do lucro: mostra o dinheiro que realmente movimentou. Uma venda no crédito entra no lucro hoje, mas só entra no caixa quando a operadora paga.', 'Fluxo negativo por vários meses seguidos é sinal de alerta, mesmo com lucro.'],
  mc: ['Margem de contribuição', 'Faturamento − custos variáveis. Em %: margem de contribuição ÷ faturamento', 'Quanto cada venda deixa para pagar as despesas fixas e gerar lucro.', 'Aumenta com preço melhor, desconto menor, custo de compra menor ou taxa de cartão menor.'],
  pe: ['Ponto de equilíbrio financeiro', 'Despesas operacionais do período ÷ margem de contribuição (%)', 'Faturamento mínimo para não ter prejuízo no período. Acima dele, a loja dá lucro.', 'Reduzir despesas fixas ou aumentar a margem baixa o ponto de equilíbrio.'],
  saldo: ['Saldo financeiro disponível', 'Saldo inicial + todas as entradas recebidas − todas as saídas pagas até hoje', 'Quanto a loja tem hoje somando caixa e banco, segundo o que foi registrado no sistema.', 'Confira o saldo com o extrato do banco uma vez por semana.'],
  areceber: ['Contas a receber', 'Soma das entradas ainda não recebidas (cartão a cair, fiado, boletos)', 'Dinheiro que já é da loja, mas ainda não chegou.', ''],
  apagar: ['Contas a pagar', 'Soma das saídas ainda não pagas (contas fixas, compras a prazo, folha)', 'Compromissos que vão sair do caixa.', ''],
  fat: ['Faturamento total', 'Soma das vendas concluídas no período, já com descontos e taxas de entrega cobradas. Vendas canceladas não contam', 'Tudo o que a loja vendeu.', ''],
  ticket: ['Ticket médio', 'Faturamento ÷ número de vendas', 'Quanto cada cliente gasta, em média, por compra.', 'Sugira produtos complementares e kits para aumentar o ticket.'],
  nvendas: ['Número de vendas realizadas', 'Quantidade de vendas concluídas no período', 'Cada venda finalizada no caixa conta uma vez, independente da quantidade de itens.', ''],
  margemprod: ['Margem de lucro por produto', '(Receita do produto − custo da mercadoria − parte proporcional de impostos, taxas e comissões) ÷ receita do produto', 'Mostra quais produtos realmente deixam dinheiro.', 'Produtos com margem baixa e muita venda merecem revisão de preço ou de fornecedor.'],
  abc: ['Curva ABC', 'A: produtos que somam os primeiros 80% do faturamento. B: os próximos 15%. C: os últimos 5%', 'Os produtos A são os que nunca podem faltar no estoque.', ''],
  qtd: ['Quantidade disponível por produto', 'Estoque inicial + compras recebidas + entradas − vendas − perdas ± ajustes', 'O saldo atual de cada produto, atualizado a cada venda e compra.', ''],
  custoest: ['Custo total do estoque', 'Soma de quantidade × custo de compra de cada produto', 'Quanto dinheiro está parado nas prateleiras.', ''],
  giro: ['Giro de estoque', 'Custo da mercadoria vendida no período ÷ estoque médio (a custo)', 'Quantas vezes o estoque foi vendido e reposto no período. Quanto maior, menos dinheiro parado.', 'Produtos parados há muito tempo podem ir para promoção.'],
  cobertura: ['Cobertura de estoque', 'Custo do estoque atual ÷ custo médio vendido por dia', 'Por quantos dias o estoque atual dura no ritmo de vendas do período.', ''],
  baixo: ['Produtos com estoque baixo ou zerado', 'Produtos com quantidade menor ou igual ao estoque mínimo cadastrado', 'Lista do que precisa ser comprado.', 'Ajuste o estoque mínimo de cada produto no cadastro.'],
  ativos: ['Clientes ativos', 'Clientes com pelo menos uma compra nos últimos N dias (configurável), contados até o fim do período', 'Sua base de clientes que ainda compra com você.', 'Identifique o cliente em cada venda para este número ser preciso.'],
  novos: ['Novos clientes', 'Clientes cuja primeira compra aconteceu no período', '', ''],
  recompra: ['Taxa de recompra', 'Clientes com 2 ou mais compras ÷ clientes que já compraram', 'Mostra se o cliente volta. Vender de novo para quem já comprou custa muito menos.', 'Use a lista "Em risco" para chamar clientes que sumiram.'],
  ticketcli: ['Ticket médio por cliente', 'Faturamento de clientes identificados ÷ número de clientes diferentes que compraram no período', 'Quanto cada cliente gastou no período, somando todas as compras dele.', ''],
  ltv: ['Lifetime Value (LTV)', 'Faturamento total dos clientes identificados ÷ número de clientes. LTV em lucro = LTV × margem de contribuição %', 'Quanto um cliente vale para a loja ao longo do relacionamento.', 'Compare com o CAC: o ideal é o LTV em lucro ser pelo menos 3 vezes o CAC.'],
  ltvcac: ['LTV ÷ CAC', 'LTV em lucro ÷ custo de aquisição de clientes', 'Quanto cada cliente devolve para cada R$ 1 gasto para conquistá-lo. Acima de 3 é saudável.', ''],
  invmkt: ['Investimento total em marketing', 'Soma dos lançamentos em categorias de marketing no período', '', 'Registre cada anúncio informando o canal para medir o retorno por canal.'],
  cac: ['Custo de aquisição de clientes (CAC)', 'Investimento em marketing ÷ novos clientes do período', 'Quanto custa, em média, conquistar cada cliente novo.', ''],
  roas: ['Retorno sobre gasto em anúncios (ROAS)', 'Faturamento das vendas vindas de canais com investimento ÷ investimento nesses canais', 'ROAS 4 significa que cada R$ 1 em anúncio trouxe R$ 4 em vendas.', 'Abaixo de 3 costuma dar prejuízo depois de pagar a mercadoria.'],
  receitacanal: ['Receita gerada por canal de aquisição', 'Vendas agrupadas pelo canal informado na venda (por padrão, o canal de origem do cliente)', 'Mostra de onde vem o dinheiro.', ''],
  roimkt: ['ROI de marketing', '(Margem de contribuição das vendas dos canais pagos − investimento) ÷ investimento', 'Retorno real do marketing, já descontando o custo da mercadoria.', ''],
  custofunc: ['Custo total com funcionários', 'Lançamentos de salários, encargos e benefícios no período. Sem lançamentos, é estimado pelo cadastro (salário + encargos + benefícios)', '', 'Use "Lançar folha do mês" na tela de funcionários.'],
  vendfunc: ['Vendas por funcionário', 'Faturamento médio por vendedor que fez vendas no período', 'Veja o ranking completo na tabela abaixo.', ''],
  prodh: ['Produtividade por hora trabalhada', 'Faturamento dos vendedores ÷ horas efetivamente trabalhadas (horas previstas − faltas e atrasos)', 'Quanto a equipe vende por hora de trabalho.', ''],
  absent: ['Taxa de absenteísmo', 'Horas de faltas e atrasos ÷ horas previstas de trabalho', 'Acima de 3% merece atenção.', ''],
  tproc: ['Tempo médio de processamento dos pedidos', 'Média do tempo entre o registro do pedido e o momento em que ficou pronto ou foi enviado', 'Vale para pedidos de entrega e retirada.', ''],
  noprazo: ['Percentual de entregas no prazo', 'Pedidos entregues até o prazo prometido ÷ pedidos entregues', '', ''],
  erros: ['Taxa de erros nos pedidos', 'Vendas com erro registrado ÷ total de vendas', 'Produto errado, item faltando, cobrança errada, avaria no envio.', 'Registre cada erro na venda para descobrir onde ele acontece.'],
  custoped: ['Custo operacional por pedido', '(Despesas operacionais + custo das entregas) ÷ número de vendas', 'Quanto custa, em média, atender cada pedido.', ''],
  custoaq: ['Custo de aquisição dos produtos', 'Total das compras de mercadoria feitas no período (produtos + frete)', '', ''],
  prazoent: ['Prazo médio de entrega dos fornecedores', 'Média de dias entre o pedido ao fornecedor e o recebimento da mercadoria', '', ''],
  prazopag: ['Prazo médio de pagamento', 'Média de dias entre o pedido ao fornecedor e o vencimento do pagamento', 'Quanto maior, mais fôlego no caixa: você vende antes de pagar.', 'Negocie prazos maiores que o giro do estoque.'],
  fornprazo: ['Taxa de entregas no prazo (fornecedores)', 'Compras recebidas até a data prevista ÷ compras recebidas', '', ''],
  custoprod: ['Custo total por produto', 'Custo de compra + outros custos por unidade (embalagem, etiqueta)', '', ''],
  preco: ['Preço de venda', 'Preço cadastrado do produto', '', ''],
  mcprod: ['Margem de contribuição por produto', 'Preço − custo − impostos − taxa média de pagamento − comissão média', 'Quanto cada unidade vendida deixa para pagar as despesas fixas.', ''],
  precomin: ['Preço mínimo sustentável', 'Custo ÷ (1 − impostos % − taxas % − comissão % − despesas fixas %)', 'Abaixo deste preço o produto não paga a parte dele nas despesas fixas e gera prejuízo.', 'As porcentagens vêm dos últimos 90 dias da loja.'],
  precosug: ['Preço sugerido', 'Custo ÷ (1 − impostos % − taxas % − comissão % − despesas fixas % − margem desejada %)', 'Preço que entrega a margem de lucro desejada configurada.', ''],
  fatprev: ['Faturamento previsto × realizado', 'Faturamento do mês ÷ meta de faturamento do mês', '', 'Defina as metas em Planejamento.'],
  lucroprev: ['Lucro previsto × realizado', 'Lucro líquido do mês ÷ meta de lucro do mês', '', ''],
  projecao: ['Projeção de fluxo de caixa', 'Saldo de hoje + contas a receber − contas a pagar, nas datas de vencimento. A linha "com tendência" soma o ritmo médio de entradas e saídas dos últimos 60 dias', 'Mostra se vai faltar dinheiro nas próximas semanas.', ''],
  roi: ['Retorno sobre investimentos (ROI)', '(Retorno obtido − valor investido) ÷ valor investido', 'ROI de 50% significa que cada R$ 1 investido voltou R$ 1,50.', ''],
  difcaixa: ['Diferenças de caixa', 'Valor contado no fechamento − valor esperado (abertura + vendas em dinheiro + suprimentos − sangrias)', 'Faltas e sobras no fechamento do caixa.', 'Diferenças frequentes com o mesmo operador merecem conversa.'],
  divest: ['Divergências de estoque', '(Quantidade contada − quantidade no sistema) × custo, nas contagens de estoque do período', '', 'Faça uma contagem completa pelo menos uma vez por mês.'],
  perdas: ['Perdas financeiras por fraudes, furtos e erros', 'Perdas registradas (furtos, fraudes, erros, avarias) + faltas de caixa', '', ''],
  audit: ['Histórico de alterações e operações', 'Toda criação, alteração, exclusão, cancelamento e acesso fica registrado com usuário, data e hora', 'O histórico não pode ser apagado pelos usuários.', ''],
  nota: ['Nota média de avaliação dos clientes', 'Média das notas de 1 a 5 registradas no período', '', 'Peça a avaliação logo após a compra.'],
  taxarecl: ['Taxa de reclamações', 'Reclamações abertas no período ÷ vendas do período', '', ''],
  tresol: ['Tempo médio de resolução de problemas', 'Média do tempo entre a abertura e a resolução das reclamações resolvidas no período', '', ''],
  recompexp: ['Taxa de recompra após a experiência de compra', 'Clientes que avaliaram ou reclamaram no período e compraram de novo depois ÷ total desses clientes', 'Mostra se a experiência faz o cliente voltar.', ''],
  fatmes: ['Faturamento do mês', 'Soma das vendas concluídas no mês', '', ''],
  lucromes: ['Lucro líquido do mês', 'Mesmo cálculo do lucro líquido, para o mês escolhido', '', ''],
  meta: ['Percentual de atingimento da meta de vendas', 'Faturamento do mês ÷ meta de faturamento do mês', '', ''],
  ritmo: ['Projeção de fechamento do mês', 'Faturamento até hoje ÷ dias passados × dias do mês', 'Quanto a loja fatura no mês se continuar no ritmo atual.', ''],
};
function showInfo(k) {
  const x = INFO[k]; if (!x) return;
  modal({ title: x[0], size: 'sm', body: '<div class="info-b">' + (x[2] ? '<p>' + esc(x[2]) + '</p>' : '') + '<div class="info-f">' + esc(x[1]) + '</div>' + (x[3] ? '<p class="ink2"><b>Dica:</b> ' + esc(x[3]) + '</p>' : '') + '</div>' });
}

/* ---------- KPIs ---------- */
function delta(cur, prev, goodUp = true) {
  if (prev === undefined || prev === null || !isFinite(cur) || !isFinite(prev)) return '';
  if (Math.abs(prev) < 0.005 && Math.abs(cur) < 0.005) return '';
  if (Math.abs(prev) < 0.005) return '<span class="delta muted">sem base anterior</span>';
  const p = (cur - prev) / Math.abs(prev);
  if (Math.abs(p) < 0.0005) return '<span class="delta muted">= período anterior</span>';
  const up = p > 0, good = up === goodUp;
  return '<span class="delta ' + (good ? 'pos' : 'neg') + '">' + (up ? '▲' : '▼') + ' ' + fp(Math.abs(p)) + ' <span class="muted" style="font-weight:500">vs anterior</span></span>';
}
function kpi(o) {
  return '<div class="kpi ' + (o.cls || '') + '"><div class="kpi-h"><span class="kpi-l">' + esc(o.l) + '</span>' + (o.i ? '<button class="qi" data-act="info" data-k="' + o.i + '" aria-label="Como é calculado: ' + esc(o.l) + '">?</button>' : '') + '</div><div class="kpi-v">' + o.v + '</div>' + (o.d || '') + (o.s ? '<div class="kpi-s">' + o.s + '</div>' : '') + '</div>';
}
const kpis = list => '<div class="kpis' + (list.length % 2 ? ' odd' : '') + '">' + list.map(kpi).join('') + '</div>';
const chip = (t, c = '') => '<span class="chip ' + c + '">' + esc(t) + '</span>';
const stars = n => '<span class="stv" aria-label="' + n + ' de 5">' + '★'.repeat(Math.round(n)) + '<span style="color:var(--line-2)">' + '★'.repeat(5 - Math.round(n)) + '</span></span>';
const moneyCls = v => (v < -0.004 ? 'neg' : v > 0.004 ? 'pos' : '');
const card = (title, body, opt = {}) => '<section class="card ' + (opt.cls || '') + '">' + (title ? '<div class="card-h"><h2>' + esc(title) + '</h2>' + (opt.i ? '<button class="qi" data-act="info" data-k="' + opt.i + '" aria-label="Como é calculado">?</button>' : '') + (opt.a || '') + (opt.sub ? '<div class="sub">' + opt.sub + '</div>' : '') + '</div>' : '') + body + '</section>';
const emptyBox = (t, sub, btn) => '<div class="empty"><b>' + esc(t) + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + (btn || '') + '</div>';
function pageHead(eyebrow, title, desc, actions) {
  return '<div class="ph"><div>' + (eyebrow ? '<div class="eyebrow">' + esc(eyebrow) + '</div>' : '') + '<h1>' + esc(title) + '</h1>' + (desc ? '<p>' + desc + '</p>' : '') + '</div>' + (actions ? '<div class="ph-a">' + actions + '</div>' : '') + '</div>';
}
function tabs(group, list, cur) {
  return '<div class="tabs" role="tablist">' + list.map(([v, l]) => '<button role="tab" aria-selected="' + (v === cur) + '" class="' + (v === cur ? 'on' : '') + '" data-act="tab" data-g="' + group + '" data-v="' + v + '">' + esc(l) + '</button>').join('') + '</div>';
}
const curTab = (g, d) => UI.tabs[g] || d;

/* ---------- barras horizontais ---------- */
function hbars(items, fmt = fm, opt = {}) {
  if (!items.length) return emptyBox(opt.empty || 'Sem dados no período');
  const max = Math.max(...items.map(x => Math.abs(x.v)), 0.0001);
  return '<div class="hb">' + items.map(x => '<div class="hb-row" title="' + esc(x.l) + ': ' + esc(fmt(x.v)) + '"><div class="hb-l">' + esc(x.l) + '</div><div class="hb-t"><div class="hb-f" style="width:' + (Math.abs(x.v) / max * 100).toFixed(2) + '%' + (x.c ? ';background:var(' + x.c + ')' : '') + '"></div></div><div class="hb-v">' + esc(fmt(x.v)) + (x.sub ? '<small class="muted">' + esc(x.sub) + '</small>' : '') + '</div></div>').join('') + '</div>';
}

/* ---------- tabelas com busca, ordenação e "mostrar mais" ---------- */
const TBL = new Map();
function table(id, o) {
  TBL.set(id, o);
  const st = UI.tbl[id] || (UI.tbl[id] = { q: '', sort: o.sort || null, dir: o.dir || -1, lim: o.limit || 50 });
  return '<div class="tbl" id="tbl-' + id + '">' + (o.search !== false && o.rows.length > 6 ? '<div class="tbl-tools"><label class="search">' + ic('search', 'sm') + '<input type="search" placeholder="' + esc(o.ph || 'Buscar…') + '" value="' + esc(st.q) + '" data-inp="tblq" data-t="' + id + '" aria-label="Buscar na tabela"></label>' + (o.tools || '') + '</div>' : (o.tools ? '<div class="tbl-tools">' + o.tools + '</div>' : '')) + '<div class="tbl-body">' + tableBody(id) + '</div></div>';
}
function tableBody(id) {
  const o = TBL.get(id); const st = UI.tbl[id];
  let rows = o.rows;
  if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter(r => (o.text ? o.text(r) : o.cols.map(c => (c.s ? c.s(r) : '')).join(' ')).toLowerCase().includes(q)); }
  if (st.sort) { const c = o.cols.find(c => c.k === st.sort); if (c && c.s) { rows = rows.slice().sort((a, b) => { const x = c.s(a), y = c.s(b); return (x < y ? -1 : x > y ? 1 : 0) * st.dir; }); } }
  if (!rows.length) return o.emptyHtml || emptyBox(st.q ? 'Nada encontrado para "' + st.q + '"' : (o.empty || 'Nenhum registro ainda'), st.q ? '' : (o.emptySub || ''), st.q ? '' : (o.emptyBtn || ''));
  const shown = rows.slice(0, st.lim);
  let h = '<div class="tbl-wrap"><table class="rt"><thead><tr>' + o.cols.map(c => '<th class="' + (c.num ? 'num ' : '') + (c.s ? 'sortable' : '') + '" ' + (c.s ? 'data-act="tsort" data-t="' + id + '" data-k="' + c.k + '"' : '') + '>' + esc(c.l) + (st.sort === c.k ? '<span class="ar">' + (st.dir > 0 ? '▲' : '▼') + '</span>' : '') + '</th>').join('') + '</tr></thead><tbody>';
  for (const r of shown) {
    h += '<tr' + (o.act ? ' class="click" data-act="' + o.act + '" data-id="' + esc(o.rowId ? o.rowId(r) : r.id) + '" tabindex="0"' : '') + '>' + o.cols.map((c, i) => { const v = c.f(r); return '<td class="' + (c.num ? 'num ' : '') + (i === 0 && !c.num ? 'main' : '') + '" data-l="' + esc(c.l) + '">' + (v === undefined || v === null ? '' : v) + '</td>'; }).join('') + '</tr>';
  }
  h += '</tbody></table></div>';
  if (rows.length > shown.length) h += '<div class="tbl-more"><button class="btn sm" data-act="tmore" data-t="' + id + '">Mostrar mais (' + fi(rows.length - shown.length) + ' restantes)</button></div>';
  return h;
}
function refreshTable(id) { const el = document.getElementById('tbl-' + id); if (el) $('.tbl-body', el).innerHTML = tableBody(id); }

/* ---------- toast ---------- */
function toast(msg, type) {
  let root = document.getElementById('toasts');
  if (!root) { root = document.createElement('div'); root.id = 'toasts'; root.setAttribute('role', 'status'); document.body.appendChild(root); }
  const t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; root.appendChild(t);
  setTimeout(() => t.remove(), type === 'err' ? 6000 : 3200);
}

/* ---------- modal ---------- */
let mdlSeq = 0;
function modal(o) {
  const n = ++mdlSeq;
  const wrap = document.createElement('div');
  wrap.className = 'ovl';
  wrap.innerHTML = '<div class="mdl ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-labelledby="mdl-t-' + n + '"><div class="mdl-h"><h2 id="mdl-t-' + n + '">' + esc(o.title) + '</h2><button type="button" class="icon-btn" data-close aria-label="Fechar">' + ic('x') + '</button></div><div class="mdl-b">' + (o.body || '') + '</div>' + (o.foot ? '<div class="mdl-f">' + o.foot + '</div>' : '') + '</div>';
  document.body.appendChild(wrap);
  document.body.classList.add('noscroll');
  let closed = false;
  const close = () => { if (closed) return; closed = true; wrap.remove(); if (!$('.ovl')) document.body.classList.remove('noscroll'); if (o.onClose) o.onClose(); };
  wrap.addEventListener('click', e => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
  wrap._close = close;
  setTimeout(() => {
    const f = wrap.querySelector('[autofocus]') || (matchMedia('(pointer:fine)').matches ? wrap.querySelector('.mdl-b input:not([type=checkbox]):not([type=radio]):not([type=search]), .mdl-b select, .mdl-b textarea') : null);
    if (f) try { f.focus(); } catch (e) { /* ok */ }
  }, 30);
  return { el: wrap, close };
}
const closeTopModal = () => { const all = $$('.ovl'); if (all.length) all[all.length - 1]._close(); };
const closeAllModals = () => { for (const m of $$('.ovl')) m._close(); };

function ask(o) {
  return new Promise(res => {
    let done = false;
    const m = modal({
      title: o.title, size: 'sm',
      body: '<p>' + o.text + '</p>' + (o.type ? '<div class="fld" style="margin-top:14px"><label for="ask-in">Digite <b>' + esc(o.type) + '</b> para confirmar</label><input id="ask-in" autocomplete="off" autocapitalize="characters"></div>' : ''),
      foot: '<span class="sp"></span><button type="button" class="btn" data-close>Cancelar</button><button type="button" class="btn ' + (o.danger ? 'danger' : 'pri') + '" id="ask-ok">' + esc(o.ok || 'Confirmar') + '</button>',
      onClose: () => { if (!done) { done = true; res(false); } },
    });
    $('#ask-ok', m.el).onclick = () => {
      if (o.type) { const v = $('#ask-in', m.el).value.trim().toUpperCase(); if (v !== o.type.toUpperCase()) { $('#ask-in', m.el).classList.add('shake'); setTimeout(() => $('#ask-in', m.el)?.classList.remove('shake'), 400); return; } }
      done = true; res(true); m.close();
    };
  });
}

/* ---------- formulários gerados a partir de uma lista de campos ---------- */
function fieldHtml(f, v) {
  const show = f.show ? ' data-f="' + (f.k || f.id) + '"' : ' data-f="' + (f.k || f.id || '') + '"';
  if (f.t === 'sep') return '<div class="frm-sep"' + show + '>' + esc(f.l) + '</div>';
  if (f.t === 'html') return '<div class="frm-html"' + show + '>' + f.html + '</div>';
  const id = 'f_' + f.k;
  const help = f.help ? '<small>' + f.help + '</small>' : '';
  const lab = '<label for="' + id + '">' + esc(f.l) + (f.req ? ' <b class="req" aria-hidden="true">*</b>' : '') + '</label>';
  const ph = f.ph ? ' placeholder="' + esc(f.ph) + '"' : '';
  let inp;
  switch (f.t) {
    case 'money': inp = '<div class="inp-pre"><span>R$</span><input id="' + id + '" name="' + f.k + '" inputmode="decimal" autocomplete="off" value="' + esc(toInput(v)) + '"' + (ph || ' placeholder="0,00"') + '></div>'; break;
    case 'pct': inp = '<div class="inp-suf"><input id="' + id + '" name="' + f.k + '" inputmode="decimal" autocomplete="off" value="' + esc(toInput(v)) + '"' + (ph || ' placeholder="0"') + '><span>%</span></div>'; break;
    case 'num': case 'int': inp = '<input id="' + id + '" name="' + f.k + '" inputmode="' + (f.t === 'int' ? 'numeric' : 'decimal') + '" autocomplete="off" value="' + esc(v === null || v === undefined || v === '' ? '' : String(v).replace('.', ',')) + '"' + ph + '>'; break;
    case 'date': inp = '<input type="date" id="' + id + '" name="' + f.k + '" value="' + esc(v ? String(v).slice(0, 10) : '') + '">'; break;
    case 'datetime': inp = '<input type="datetime-local" id="' + id + '" name="' + f.k + '" value="' + esc(v ? String(v).slice(0, 16) : '') + '">'; break;
    case 'select': { const opts = typeof f.opts === 'function' ? f.opts() : f.opts; inp = '<select id="' + id + '" name="' + f.k + '">' + opts.map(([ov, ol]) => '<option value="' + esc(ov) + '"' + (String(ov) === String(v ?? '') ? ' selected' : '') + '>' + esc(ol) + '</option>').join('') + '</select>'; break; }
    case 'textarea': inp = '<textarea id="' + id + '" name="' + f.k + '" rows="3"' + ph + '>' + esc(v || '') + '</textarea>'; break;
    case 'check': return '<div class="fld chk"' + show + '><label class="ck"><input type="checkbox" id="' + id + '" name="' + f.k + '"' + (v ? ' checked' : '') + '><span>' + esc(f.l) + '</span></label>' + help + '</div>';
    case 'seg': { const opts = typeof f.opts === 'function' ? f.opts() : f.opts; return '<div class="fld' + (f.half ? ' half' : '') + '"' + show + '><span class="lb">' + esc(f.l) + '</span><div class="seg" role="radiogroup" aria-label="' + esc(f.l) + '">' + opts.map(([ov, ol], i) => '<label><input type="radio" name="' + f.k + '" value="' + esc(ov) + '"' + (String(ov) === String(v ?? opts[0][0]) ? ' checked' : '') + ' id="' + id + '_' + i + '"><span>' + esc(ol) + '</span></label>').join('') + '</div>' + help + '</div>'; }
    case 'stars': return '<div class="fld"' + show + '><span class="lb">' + esc(f.l) + '</span><div class="stars" role="radiogroup" aria-label="' + esc(f.l) + '">' + [5, 4, 3, 2, 1].map(n => '<input type="radio" name="' + f.k + '" value="' + n + '" id="' + id + '_' + n + '"' + (+v === n ? ' checked' : '') + '><label for="' + id + '_' + n + '" title="' + n + ' estrela' + (n > 1 ? 's' : '') + '">★</label>').join('') + '</div>' + help + '</div>';
    default: {
      const list = f.list ? (typeof f.list === 'function' ? f.list() : f.list) : null;
      inp = '<input id="' + id + '" name="' + f.k + '" autocomplete="off" value="' + esc(v ?? '') + '"' + ph + (f.max ? ' maxlength="' + f.max + '"' : '') + (list ? ' list="' + id + '_l"' : '') + (f.inputmode ? ' inputmode="' + f.inputmode + '"' : '') + '>' + (list ? '<datalist id="' + id + '_l">' + list.map(x => '<option value="' + esc(x) + '">').join('') + '</datalist>' : '');
    }
  }
  return '<div class="fld' + (f.half ? ' half' : '') + '"' + show + '>' + lab + inp + help + '</div>';
}
function openForm(o) {
  const vals = Object.assign({}, o.values || {});
  const m = modal({
    title: o.title, size: o.size,
    body: (o.intro ? '<p class="ink2" style="margin-bottom:14px">' + o.intro + '</p>' : '') + '<form class="frm" id="frm-' + mdlSeq + '" novalidate>' + o.fields.map(f => fieldHtml(f, vals[f.k])).join('') + '<div class="frm-live"></div><div class="frm-err" role="alert"></div><button type="submit" hidden></button></form>',
    foot: (o.danger ? '<button type="button" class="btn ghost danger" data-fdel>' + ic('trash', 'sm') + esc(o.danger.l) + '</button>' : '') + '<span class="sp"></span><button type="button" class="btn" data-close>Cancelar</button><button type="button" class="btn pri" data-fok>' + esc(o.submit || 'Salvar') + '</button>',
    onClose: o.onClose,
  });
  const frm = $('form', m.el);
  const read = () => {
    const out = Object.assign({}, vals);
    for (const f of o.fields) {
      if (!f.k || f.t === 'sep' || f.t === 'html') continue;
      const el = frm.elements[f.k]; if (!el) continue;
      switch (f.t) {
        case 'money': case 'num': case 'pct': out[f.k] = el.value.trim() === '' ? (f.t === 'num' ? null : 0) : parseNum(el.value); break;
        case 'int': out[f.k] = el.value.trim() === '' ? null : Math.round(parseNum(el.value)); break;
        case 'check': out[f.k] = !!el.checked; break;
        case 'stars': out[f.k] = +(el.value || 0); break;
        default: out[f.k] = String(el.value ?? '').trim();
      }
    }
    return out;
  };
  const refresh = () => {
    const v = read();
    for (const f of o.fields) if (f.show) { const w = frm.querySelector('[data-f="' + (f.k || f.id) + '"]'); if (w) w.hidden = !f.show(v); }
    if (o.live) $('.frm-live', m.el).innerHTML = o.live(v) || '';
    if (o.onChange) o.onChange(v, frm);
  };
  frm.addEventListener('input', refresh); frm.addEventListener('change', refresh); refresh();
  const submit = async () => {
    const v = read(); const err = $('.frm-err', m.el); err.textContent = '';
    $$('.fld.err', frm).forEach(x => x.classList.remove('err'));
    for (const f of o.fields) {
      if (!f.req || !f.k) continue;
      if (f.show && !f.show(v)) continue;
      const el = frm.elements[f.k];
      const raw = el ? (el.value ?? '') : '';
      if (String(raw).trim() === '' || (f.t === 'stars' && !v[f.k])) { const w = frm.querySelector('[data-f="' + f.k + '"]'); if (w) w.classList.add('err'); err.textContent = 'Preencha o campo "' + f.l + '".'; return; }
    }
    let r;
    try { r = await o.onSubmit(v, m); } catch (e) { console.error(e); r = 'Não foi possível salvar: ' + (e.message || e); }
    if (typeof r === 'string') { err.textContent = r; return; }
    if (r !== false) m.close();
  };
  frm.addEventListener('submit', e => { e.preventDefault(); submit(); });
  $('[data-fok]', m.el).onclick = submit;
  if (o.danger) $('[data-fdel]', m.el).onclick = async () => { const ok = await o.danger.f(read()); if (ok !== false) m.close(); };
  return m;
}

/* ---------- seletor de período ---------- */
function openPeriod() {
  const cur = UI.period; const r = rangeFor(cur);
  const m = modal({
    title: 'Período dos indicadores', size: 'sm',
    body: '<div class="per-list">' + PERIODS.map(p => { const rr = rangeFor(p); return '<button type="button" data-per="' + p.id + '"><span class="ck2">' + (cur.id === p.id ? '✓' : '') + '</span><span>' + esc(p.l) + '</span><small class="muted">' + (rr.from === rr.to ? fd(rr.from) : fds(rr.from) + ' – ' + fds(rr.to)) + '</small></button>'; }).join('') + '</div>' +
      '<div class="per-custom"><div class="fld"><label for="per-f">De</label><input type="date" id="per-f" value="' + r.from + '"></div><div class="fld"><label for="per-t">Até</label><input type="date" id="per-t" value="' + r.to + '"></div><button type="button" class="btn pri" id="per-ok">Aplicar</button></div>',
  });
  m.el.addEventListener('click', e => {
    const b = e.target.closest('[data-per]'); if (!b) return;
    setPeriod({ id: b.dataset.per }); m.close();
  });
  $('#per-ok', m.el).onclick = () => { const f = $('#per-f', m.el).value, t = $('#per-t', m.el).value; if (!f || !t) return; setPeriod({ id: 'custom', from: f, to: t }); m.close(); };
}
function setPeriod(p) { UI.period = p; LS.set('period', p); render(); }
const curRange = () => rangeFor(UI.period);

/* ---------- gráficos SVG (desenhados com a largura real do contêiner) ---------- */
const CH = new Map(); let chSeq = 0;
function chart(spec) {
  const id = 'ch' + (++chSeq); CH.set(id, spec);
  const leg = spec.series.length > 1 ? '<div class="legend">' + spec.series.map(s => '<span><i class="' + (spec.type === 'line' ? 'lk' + (s.dash ? ' dash' : '') : 'bk') + '" style="--c:var(' + s.c + ')"></i>' + esc(s.name) + '</span>').join('') + '</div>' : '';
  const all = spec.series.flatMap(s => s.values);
  const has = all.some(v => v && Math.abs(v) > 0.0001);
  if (!has && !spec.allowEmpty) return leg + '<div class="chart" style="height:' + (spec.h || 220) + 'px;display:grid;place-items:center"><span class="muted">Sem movimento no período</span></div>';
  return leg + '<div class="chart" id="' + id + '" style="height:' + (spec.h || 220) + 'px" role="img" aria-label="' + esc(spec.aria || '') + '"></div>';
}
function niceTicks(min, max, count = 4) {
  if (min === max) { max = min + 1; }
  const span = max - min; const step0 = span / count; const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag; const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
  const out = []; for (let v = lo; v <= hi + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
function drawCharts() {
  for (const [id, sp] of CH) {
    const el = document.getElementById(id); if (!el) continue;
    const w = Math.floor(el.clientWidth); if (!w) continue;
    el.innerHTML = sp.type === 'line' ? svgLine(sp, w) : svgBars(sp, w);
  }
}
function axisFrame(sp, W, allVals) {
  const H = sp.h || 220;
  const yf = sp.yf || fmAxis;
  let mn = Math.min(0, ...allVals), mx = Math.max(0, ...allVals);
  if (mx === mn) mx = mn + 1;
  const ticks = niceTicks(mn, mx, H < 200 ? 3 : 4); mn = ticks[0]; mx = ticks[ticks.length - 1];
  const L = Math.max(...ticks.map(t => yf(t).length)) * 6.4 + 12, R = 12, T = 10, B = 24;
  const pw = Math.max(10, W - L - R), ph = H - T - B;
  const Y = v => T + ph - (v - mn) / (mx - mn) * ph;
  let g = '';
  for (const t of ticks) { const y = Y(t).toFixed(1); g += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '" class="' + (t === 0 ? 'base' : 'grid') + '"/><text x="' + (L - 8) + '" y="' + (+y + 4) + '" text-anchor="end" class="ax">' + esc(yf(t)) + '</text>'; }
  return { H, L, R, T, B, pw, ph, Y, g, mn, mx };
}
function xLabels(sp, fr, n, X) {
  const xf = sp.xf || (x => x);
  const maxLabels = Math.max(2, Math.floor(fr.pw / 64));
  const step = Math.max(1, Math.ceil(n / maxLabels));
  let g = '';
  for (let i = 0; i < n; i += step) {
    const x = X(i); const anchor = n === 1 ? 'middle' : i === 0 ? 'start' : (x > fr.L + fr.pw - 26 ? 'end' : 'middle');
    g += '<text x="' + x.toFixed(1) + '" y="' + (fr.H - 6) + '" text-anchor="' + anchor + '" class="ax">' + esc(xf(sp.labels[i])) + '</text>';
  }
  return g;
}
function svgLine(sp, W) {
  const n = sp.labels.length;
  const fr = axisFrame(sp, W, sp.series.flatMap(s => s.values.filter(v => v !== null && v !== undefined)));
  const X = i => fr.L + (n <= 1 ? fr.pw / 2 : i * fr.pw / (n - 1));
  let g = fr.g + xLabels(sp, fr, n, X);
  sp.series.forEach((s, si) => {
    let d = '', started = false, last = null;
    s.values.forEach((v, i) => { if (v === null || v === undefined) { started = false; return; } d += (started ? 'L' : 'M') + X(i).toFixed(1) + ',' + fr.Y(v).toFixed(1); started = true; last = i; });
    if (sp.area && si === 0 && d) {
      const b = fr.Y(Math.max(fr.mn, 0)).toFixed(1);
      const first = s.values.findIndex(v => v !== null && v !== undefined);
      g += '<path d="' + d + 'L' + X(last).toFixed(1) + ',' + b + 'L' + X(first).toFixed(1) + ',' + b + 'Z" class="ar" style="fill:var(' + s.c + ');opacity:.10"/>';
    }
    g += '<path d="' + d + '" class="ln' + (s.dash ? ' dash' : '') + '" style="stroke:var(' + s.c + ')"/>';
    if (last !== null && !s.dash) g += '<circle cx="' + X(last).toFixed(1) + '" cy="' + fr.Y(s.values[last]).toFixed(1) + '" r="4" class="dt" style="fill:var(' + s.c + ')"/>';
  });
  g += '<line class="xh" x1="0" x2="0" y1="' + fr.T + '" y2="' + (fr.T + fr.ph) + '" visibility="hidden"/><g class="hd"></g>';
  sp._g = { kind: 'line', L: fr.L, pw: fr.pw, n, X, Y: fr.Y };
  return '<svg width="' + W + '" height="' + fr.H + '" viewBox="0 0 ' + W + ' ' + fr.H + '">' + g + '</svg>';
}
function barPath(x, w, y0, y1, r) {
  const h = Math.abs(y1 - y0); if (h < 0.5) return '';
  r = Math.min(r, w / 2, h);
  if (y1 < y0) return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
  return 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
}
function svgBars(sp, W) {
  const n = sp.labels.length, k = sp.series.length;
  const fr = axisFrame(sp, W, sp.series.flatMap(s => s.values));
  const band = fr.pw / n;
  const bw = Math.max(1.5, Math.min(24, (band * 0.72 - (k - 1) * 2) / k));
  const gw = k * bw + (k - 1) * 2;
  const X = i => fr.L + i * band + band / 2;
  let g = '<rect class="band" x="0" y="' + fr.T + '" width="' + band.toFixed(1) + '" height="' + fr.ph + '" visibility="hidden"/>' + fr.g + xLabels(sp, fr, n, X);
  const y0 = fr.Y(0);
  for (let i = 0; i < n; i++) {
    const x0 = fr.L + i * band + (band - gw) / 2;
    sp.series.forEach((s, si) => {
      const v = s.values[i] || 0; const x = x0 + si * (bw + 2);
      const p = barPath(+x.toFixed(1), +bw.toFixed(1), +y0.toFixed(1), +fr.Y(v).toFixed(1), 4);
      if (p) g += '<path d="' + p + '" style="fill:var(' + s.c + ')"/>';
    });
  }
  sp._g = { kind: 'bar', L: fr.L, pw: fr.pw, n, band, T: fr.T, ph: fr.ph };
  return '<svg width="' + W + '" height="' + fr.H + '" viewBox="0 0 ' + W + ' ' + fr.H + '">' + g + '</svg>';
}
function chartHover(el, cx, cy) {
  const sp = CH.get(el.id); if (!sp || !sp._g) return hideTip();
  const g = sp._g; const rect = el.getBoundingClientRect(); const x = cx - rect.left;
  if (x < g.L - 10 || x > g.L + g.pw + 10) return hideTip();
  let i = g.kind === 'line' ? Math.round((x - g.L) / (g.pw / Math.max(1, g.n - 1))) : Math.floor((x - g.L) / g.band);
  i = clamp(i, 0, g.n - 1);
  const svg = el.querySelector('svg'); if (!svg) return;
  if (g.kind === 'line') {
    const xh = svg.querySelector('.xh'); const px = g.X(i).toFixed(1);
    xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.setAttribute('visibility', 'visible');
    svg.querySelector('.hd').innerHTML = sp.series.map(s => { const v = s.values[i]; return v === null || v === undefined ? '' : '<circle cx="' + px + '" cy="' + g.Y(v).toFixed(1) + '" r="4.5" class="dt" style="fill:var(' + s.c + ')"/>'; }).join('');
  } else {
    const b = svg.querySelector('.band'); b.setAttribute('x', (g.L + i * g.band).toFixed(1)); b.setAttribute('visibility', 'visible');
  }
  const tip = document.getElementById('tip');
  tip.replaceChildren();
  const tt = document.createElement('div'); tt.className = 'tt'; tt.textContent = (sp.xt || sp.xf || (v => v))(sp.labels[i]); tip.appendChild(tt);
  const vf = sp.vf || fm;
  for (const s of sp.series) {
    const v = s.values[i]; if (v === null || v === undefined) continue;
    const row = document.createElement('div'); row.className = 'tr';
    const key = document.createElement('i'); key.style.background = 'var(' + s.c + ')';
    const b = document.createElement('b'); b.textContent = vf(v);
    const sn = document.createElement('span'); sn.textContent = s.name;
    row.append(key, b, sn); tip.appendChild(row);
  }
  tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  let lx = cx + 14, ly = cy - th - 10;
  if (lx + tw > innerWidth - 8) lx = cx - tw - 14;
  if (ly < 8) ly = cy + 16;
  tip.style.left = Math.max(8, lx) + 'px'; tip.style.top = ly + 'px';
}
function hideTip() {
  const tip = document.getElementById('tip'); if (tip) tip.hidden = true;
  for (const svg of $$('.chart svg')) { const xh = svg.querySelector('.xh'); if (xh) xh.setAttribute('visibility', 'hidden'); const hd = svg.querySelector('.hd'); if (hd) hd.innerHTML = ''; const b = svg.querySelector('.band'); if (b) b.setAttribute('visibility', 'hidden'); }
}

/* ---------- copiar e baixar ---------- */
async function copyText(text, okMsg = 'Copiado') {
  try { await navigator.clipboard.writeText(text); toast(okMsg); return true; } catch (e) {
    const m = modal({ title: 'Copie o texto abaixo', body: '<textarea class="raw" readonly>' + esc(text) + '</textarea><p class="muted" style="margin-top:8px">Selecione tudo e copie (Ctrl+C ou toque e segure).</p>' });
    const ta = $('textarea', m.el); ta.focus(); ta.select(); return false;
  }
}
function download(name, content, type = 'application/json') {
  try {
    const blob = new Blob([content], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    return true;
  } catch (e) { return false; }
}
function csv(rows, cols) {
  const q = v => { const s = v === null || v === undefined ? '' : typeof v === 'number' ? String(r2(v)).replace('.', ',') : String(v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  return '﻿' + cols.map(c => q(c[0])).join(';') + '\n' + rows.map(r => cols.map(c => q(c[1](r))).join(';')).join('\n');
}
