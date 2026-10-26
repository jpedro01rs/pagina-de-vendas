/* ============================================================
   Loja de demonstração: 6 meses de operação simulada, sempre terminando hoje
   ============================================================ */
function buildDemo() {
  const prevS = S;
  const st = newState();
  S = st; invalidate();
  const rnd = mulberry32(20261026);
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const rf = (a, b) => a + rnd() * (b - a);
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const wpick = (items, w) => { const t = sum(w); let x = rnd() * t; for (let i = 0; i < items.length; i++) { x -= w[i]; if (x <= 0) return items[i]; } return items[items.length - 1]; };
  const cfg = st.config;
  const T = today(), NOW = nowS();
  const DAYS = 182;
  const START = addDays(T, -DAYS);
  Object.assign(cfg, { storeName: 'Loja Exemplo Moda & Cia', ownerName: 'Ana Souza', doc: '12.345.678/0001-90', phone: '(11) 98765-4321', address: 'Rua das Flores, 123 — Centro', initialBalance: 18000, startDate: START, taxRate: 6, targetMargin: 15, monthlyGoal: 56000, recoveryCode: 'DEMO-2026' });
  st.users = [
    { id: 'u_ana', name: 'Ana Souza', role: 'admin', pin: null, active: true },
    { id: 'u_bruno', name: 'Bruno Lima', role: 'operador', pin: hashPin('1234'), active: true },
    { id: 'u_carla', name: 'Carla Mendes', role: 'operador', pin: null, active: true },
  ];
  const userByName = n => st.users.find(u => u.name === n);
  const audit = (at, user, action, entity, summary, id) => st.audit.push({ id: uid(), at, userId: userByName(user)?.id || null, user, action, entity, summary, entityId: id || null });
  st.employees = [
    { id: 'e_bruno', name: 'Bruno Lima', role: 'Vendedor', salary: 2100, chargesPct: 28, benefits: 350, weeklyHours: 44, commissionPct: 2, hireDate: addDays(START, -420), userId: 'u_bruno', active: true },
    { id: 'e_carla', name: 'Carla Mendes', role: 'Vendedora', salary: 2100, chargesPct: 28, benefits: 350, weeklyHours: 44, commissionPct: 2, hireDate: addDays(START, -260), userId: 'u_carla', active: true },
    { id: 'e_diego', name: 'Diego Rocha', role: 'Estoquista e entregas', salary: 1900, chargesPct: 28, benefits: 300, weeklyHours: 44, commissionPct: 0, hireDate: addDays(START, -90), active: true },
  ];
  st.suppliers = [
    { id: 'f_tex', name: 'Têxtil Horizonte Ltda', contact: 'Marcos', phone: '(11) 3333-1020', leadTimeDays: 7, paymentTermDays: 28, doc: '22.111.333/0001-40' },
    { id: 'f_jea', name: 'Jeans Brasil Confecções', contact: 'Patrícia', phone: '(19) 3222-4455', leadTimeDays: 10, paymentTermDays: 30 },
    { id: 'f_cal', name: 'Calçados Passo Firme', contact: 'Rogério', phone: '(51) 3011-7788', leadTimeDays: 12, paymentTermDays: 35 },
    { id: 'f_ace', name: 'Acessórios Brilho & Cia', contact: 'Juliana', phone: '(11) 2999-3030', leadTimeDays: 5, paymentTermDays: 21 },
  ];
  const P = [
    ['CAM-001', 'Camiseta básica algodão', 'Camisetas', 22, 59.9, 'f_tex', 10, 15, 60],
    ['CAM-002', 'Camiseta estampada', 'Camisetas', 28, 79.9, 'f_tex', 7, 10, 40],
    ['FIT-001', 'Regata dry fit', 'Fitness', 19, 49.9, 'f_tex', 4, 8, 30],
    ['FIT-002', 'Legging fitness', 'Fitness', 38, 99.9, 'f_tex', 5, 8, 30],
    ['AGA-001', 'Moletom canguru', 'Agasalhos', 72, 179.9, 'f_tex', 3, 5, 18],
    ['BLU-001', 'Blusa de tricô', 'Blusas', 55, 139.9, 'f_tex', 3, 5, 15],
    ['VES-001', 'Vestido midi floral', 'Vestidos', 68, 169.9, 'f_tex', 4, 5, 18],
    ['VES-002', 'Macacão de linho', 'Vestidos', 85, 219.9, 'f_tex', 2, 3, 10],
    ['INT-001', 'Pijama de algodão', 'Íntimo', 42, 109.9, 'f_tex', 2, 4, 14],
    ['INT-002', 'Kit meias (3 pares)', 'Íntimo', 12, 34.9, 'f_tex', 5, 10, 40],
    ['CAL-001', 'Calça jeans skinny', 'Calças', 78, 189.9, 'f_jea', 6, 8, 30],
    ['CAL-002', 'Calça jeans reta', 'Calças', 82, 199.9, 'f_jea', 4, 6, 22],
    ['BER-001', 'Bermuda de sarja', 'Bermudas', 48, 119.9, 'f_jea', 4, 6, 20],
    ['AGA-002', 'Jaqueta jeans', 'Agasalhos', 110, 269.9, 'f_jea', 2, 3, 10],
    ['SAI-001', 'Saia plissada', 'Saias', 46, 119.9, 'f_jea', 2, 4, 12],
    ['CMS-001', 'Camisa social slim', 'Camisas', 58, 149.9, 'f_jea', 3, 5, 15],
    ['CAL-T01', 'Tênis casual branco', 'Calçados', 115, 279.9, 'f_cal', 4, 6, 20],
    ['CAL-S01', 'Sandália rasteira', 'Calçados', 35, 89.9, 'f_cal', 4, 6, 20],
    ['CAL-B01', 'Bota cano curto', 'Calçados', 140, 239.9, 'f_cal', 1.5, 3, 8],
    ['ACE-001', 'Bolsa transversal', 'Acessórios', 62, 159.9, 'f_ace', 3, 4, 14],
    ['ACE-002', 'Cinto de couro', 'Acessórios', 28, 79.9, 'f_ace', 3, 5, 18],
    ['ACE-003', 'Boné aba curva', 'Acessórios', 21, 59.9, 'f_ace', 3, 5, 18],
    ['ACE-004', 'Óculos de sol', 'Acessórios', 38, 119.9, 'f_ace', 2.5, 4, 14],
    ['BIJ-001', 'Brinco argola prata', 'Bijuterias', 14, 49.9, 'f_ace', 4, 8, 30],
    ['ACE-005', 'Carteira de couro', 'Acessórios', 32, 89.9, 'f_ace', 1.5, 3, 10],
  ];
  st.products = P.map(([sku, name, category, cost, price, sup, w, min, init], i) => ({ id: 'p' + i, sku, name, category, cost, extraCost: 1.5, price, unit: 'un', stock: 0, minStock: min, supplierId: sup, active: true, createdAt: START + 'T08:00', _w: w, _init: init, _base: cost }));
  invalidate();
  for (const p of st.products) addMove(p.id, p._init, 'inicial', null, p.cost, 'Estoque inicial', START + 'T08:00');
  const noReorder = new Set(['p7', 'p18']); // macacão e bota saem de linha no último mês
  const tightReorder = new Set(['p0', 'p10']); // reposição atrasada: estoque baixo hoje

  // clientes
  const FN = ['Ana', 'Beatriz', 'Bruna', 'Camila', 'Carolina', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Juliana', 'Larissa', 'Letícia', 'Luana', 'Mariana', 'Natália', 'Patrícia', 'Rafaela', 'Renata', 'Sabrina', 'Tatiane', 'Vanessa', 'Yasmin', 'André', 'Bruno', 'Caio', 'Diego', 'Eduardo', 'Felipe', 'Gustavo', 'Henrique', 'Igor', 'João', 'Lucas', 'Marcelo', 'Mateus', 'Pedro', 'Rafael', 'Rodrigo', 'Thiago', 'Vinícius'];
  const LN = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Moreira', 'Araújo', 'Cardoso', 'Teixeira', 'Mendes'];
  const chans = ['loja', 'insta', 'whats', 'indic', 'google', 'face', 'tiktok', 'site'];
  const chW = [34, 26, 12, 10, 8, 5, 3, 2];
  const NC = 230;
  const used = new Set();
  st.customers = [];
  for (let i = 0; i < NC; i++) {
    let name; let g = 0; do { name = pick(FN) + ' ' + pick(LN) + (rnd() < 0.25 ? ' ' + pick(LN) : ''); } while (used.has(name) && g++ < 20); used.add(name);
    const join = Math.floor(Math.pow(rnd(), 0.85) * (DAYS - 1));
    const ch = wpick(chans, chW);
    st.customers.push({ id: 'c' + i, name, phone: '(11) 9' + ri(6000, 9999) + '-' + ri(1000, 9999), email: rnd() < 0.5 ? name.split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') + ri(10, 99) + '@email.com' : '', channelId: ch, createdAt: addDays(START, join) + 'T09:00', birth: rnd() < 0.4 ? (1975 + ri(0, 30)) + '-' + pad(ri(1, 12)) + '-' + pad(ri(1, 28)) : '', _join: join, _loy: rnd() < 0.42 ? 0 : Math.pow(rnd(), 1.6) * 3 + 0.2 });
  }
  invalidate();
  const byJoin = groupBy(st.customers, c => c._join);

  // cronograma de caixas (últimos 75 dias)
  const cashFrom = DAYS - 75;
  const sessByDay = new Map();
  const opWeekday = ['Carla Mendes', 'Bruno Lima'];

  // simulação dia a dia
  const openPO = new Map(); // productId -> compra
  const salesPerDay = [0.45, 0.72, 0.8, 0.88, 1.0, 1.22, 1.65];
  const weights = st.products.map(p => p._w);
  const hourW = [0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 6, 9, 10, 8, 6, 6, 7, 9, 10, 7, 4, 1];
  const hours = hourW.map((_, i) => i);
  const pms = ['din', 'pix', 'deb', 'cre', 'par', 'fia'], pmW = [16, 36, 17, 21, 8, 2];
  const reasons = ['Cliente desistiu da compra', 'Troca por outro produto', 'Lançamento duplicado', 'Valor digitado errado'];
  const ERR = ['Produto errado', 'Tamanho ou cor errada', 'Item faltando', 'Avaria no envio', 'Cobrança errada'];
  const newPurchase = (sup, day, items) => {
    const s = st.suppliers.find(x => x.id === sup);
    const od = addDays(START, day);
    const late = rnd() < 0.24 ? ri(1, 5) : -ri(0, 2);
    const freight = r2(sum(items, i => i.qty * i.unitCost) * 0.03);
    const p = { id: uid(), number: ++st.meta.purchaseSeq, supplierId: sup, orderDate: od, expectedDate: addDays(od, s.leadTimeDays), receivedDate: null, dueDate: addDays(od, s.paymentTermDays), items, freight, total: r2(sum(items, i => i.qty * i.unitCost) + freight), status: 'pedido', notes: '', createdAt: od + 'T10:15', user: 'Ana Souza', _arrive: day + Math.max(2, s.leadTimeDays + late) };
    st.purchases.push(p);
    const paidDay = addDays(p.dueDate, 0);
    st.ledger.push({ id: uid(), type: 'out', date: od, amount: p.total, categoryId: 'mercadoria', description: 'Compra #' + p.number + ' — ' + s.name, purchaseId: p.id, status: paidDay <= T ? 'pago' : 'pendente', paidDate: paidDay <= T ? paidDay : null, dueDate: p.dueDate, createdAt: od + 'T10:15' });
    audit(od + 'T10:15', 'Ana Souza', 'criou', 'Compra', 'Compra #' + p.number + ' de ' + s.name + ' — ' + fm(p.total), p.id);
    for (const it of items) openPO.set(it.productId, p);
    return p;
  };
  const sessionsList = [];
  for (let d = 0; d <= DAYS; d++) {
    const day = addDays(START, d);
    const isToday = d === DAYS;
    const wd = parseD(day).getDay();
    // recebimento de compras
    for (const p of st.purchases) if (p.status === 'pedido' && p._arrive === d) { receivePurchase(p, day, true); audit(day + 'T11:30', 'Ana Souza', 'recebeu', 'Compra', 'Compra #' + p.number + ' de ' + supName(p.supplierId), p.id); for (const it of p.items) openPO.delete(it.productId); }
    // caixa do dia
    let sess = null;
    if (d >= cashFrom) {
      const op = wd === 6 || wd === 0 ? 'Bruno Lima' : opWeekday[d % 2];
      sess = { id: uid(), openedAt: day + 'T09:0' + ri(0, 9), openedBy: op, openedById: userByName(op).id, openingAmount: 200, movements: [] };
      st.cash.push(sess); sessionsList.push(sess); sessByDay.set(d, sess);
      audit(sess.openedAt, op, 'abriu', 'Caixa', 'Abertura de caixa com ' + fm(200), sess.id);
    }
    // vendas
    const trend = 0.86 + 0.26 * (d / DAYS);
    const season = 1 + 0.1 * Math.sin(d / 18);
    const expected = 11.4 * salesPerDay[wd] * trend * season;
    let n = Math.max(0, Math.round(expected + (rnd() - 0.5) * 4));
    const newcomers = (byJoin.get(d) || []).slice();
    n = Math.max(n, newcomers.length);
    const pool = st.customers.filter(c => c._join < d && c._loy > 0);
    const poolW = pool.map(c => c._loy);
    const curH = isToday ? +NOW.slice(11, 13) : 24;
    const times = Array.from({ length: n }, () => { let h; let g = 0; do { h = wpick(hours, hourW); } while (h >= curH && g++ < 30); return h; }).filter(h => h < curH).sort((a, b) => a - b);
    for (const h of times) {
      const date = day + 'T' + pad(h) + ':' + pad(ri(0, 59));
      if (isToday && date > NOW) continue;
      let cust = null;
      if (newcomers.length) cust = newcomers.shift();
      else if (rnd() < 0.62 && pool.length) cust = wpick(pool, poolW);
      const channelId = cust ? cust.channelId : (rnd() < 0.85 ? 'loja' : 'whats');
      const nItems = wpick([1, 2, 3, 4], [55, 30, 11, 4]);
      const items = [];
      for (let k = 0; k < nItems; k++) {
        let p = null, g = 0;
        do { p = wpick(st.products, weights); g++; } while (g < 12 && (p.stock < 1 || items.some(i => i.productId === p.id)));
        if (!p || p.stock < 1 || items.some(i => i.productId === p.id)) continue;
        const qty = p.price < 60 && rnd() < 0.25 ? 2 : 1;
        if (p.stock < qty) continue;
        items.push({ productId: p.id, qty, price: p.price });
      }
      if (!items.length) continue;
      const subtotal = sum(items, i => i.qty * i.price);
      const emp = wpick(['e_bruno', 'e_carla', null], [44, 41, 15]);
      let discount = 0;
      if (rnd() < 0.16) discount = r2(subtotal * pick([0.05, 0.05, 0.1, 0.1, 0.15]));
      if (emp === 'e_bruno' && rnd() < 0.03) discount = r2(subtotal * 0.2);
      const pm = cust ? wpick(pms, pmW) : wpick(pms.slice(0, 5), pmW.slice(0, 5));
      const online = ['insta', 'whats', 'site', 'face', 'tiktok'].includes(channelId);
      let ful = null;
      if ((online && rnd() < 0.55) || rnd() < 0.03) {
        const promised = addHours(date, rnd() < 0.5 ? 24 : 48).slice(0, 10) + 'T18:00';
        const proc = addHours(date, rf(1.2, 26));
        const deliv = addHours(proc, rf(2, rnd() < 0.12 ? 60 : 30));
        ful = { type: rnd() < 0.78 ? 'entrega' : 'retirada', status: 'entregue', promisedAt: promised, processedAt: proc <= NOW ? proc : null, deliveredAt: deliv <= NOW ? deliv : null, shippingCharged: rnd() < 0.6 ? 12 : 0, shippingCost: 11, address: '' };
        if (ful.type === 'retirada') { ful.shippingCharged = 0; ful.shippingCost = 0; }
        if (!ful.processedAt) ful.deliveredAt = null;
        ful.status = ful.deliveredAt ? 'entregue' : ful.processedAt ? 'enviado' : 'novo';
      }
      const userName = emp === 'e_bruno' ? 'Bruno Lima' : emp === 'e_carla' ? 'Carla Mendes' : 'Ana Souza';
      CUR = userByName(userName);
      const fiado = pm === 'fia';
      const sale = saveSale({ items, customerId: cust ? cust.id : null, employeeId: emp, channelId, paymentMethodId: pm, discount, date, fulfillment: ful, cashSessionId: pm === 'din' && sess ? sess.id : null, dueDate: fiado ? addDays(day, 30) : undefined, userId: CUR.id }, { silent: true });
      if (fiado) { const e = st.ledger.find(x => x.saleId === sale.id); if (e && e.dueDate <= addDays(T, -6) && rnd() < 0.85) { e.status = 'pago'; e.paidDate = addDays(e.dueDate, ri(-3, 4)); if (e.paidDate > T) e.paidDate = T; } }
      audit(date, userName, 'criou', 'Venda', 'Venda #' + sale.number + ' — ' + fm(sale.total) + ' (' + pmName(pm) + ')' + (discount ? ', desconto de ' + fm(discount) : ''), sale.id);
      if (rnd() < 0.021) { sale.error = { type: pick(ERR), note: '', at: addHours(date, 20), user: 'Carla Mendes' }; }
      if (rnd() < 0.011 && !isToday) { cancelSale(sale, pick(reasons), { silent: true, at: addHours(date, rf(0.1, 3)), by: userName }); audit(sale.cancelledAt, userName, 'cancelou', 'Venda', 'Venda #' + sale.number + ' (' + fm(sale.total) + ') — motivo: ' + sale.cancelReason, sale.id); continue; }
      // avaliação e reclamação
      if (cust && rnd() < 0.24 && !isToday) {
        const rating = wpick([5, 4, 3, 2, 1], [58, 27, 9, 4, 2]);
        const C = { 5: ['Atendimento excelente!', 'Amei as peças, voltarei com certeza.', 'Ótima qualidade e entrega rápida.', 'Vendedora muito atenciosa.', ''], 4: ['Gostei muito, só demorou um pouco.', 'Boa variedade de tamanhos.', 'Produto bom, preço justo.', ''], 3: ['Ok, mas poderia ter mais opções.', 'A fila do caixa estava grande.'], 2: ['A peça desbotou na primeira lavagem.', 'Demorou para entregar.'], 1: ['Veio o tamanho errado e ninguém respondeu.', 'Não gostei do atendimento.'] };
        st.reviews.push({ id: uid(), date: addDays(day, ri(0, 3)) > T ? T : addDays(day, ri(0, 3)), customerId: cust.id, saleId: sale.id, rating, comment: pick(C[rating]), source: wpick(['Pessoalmente', 'WhatsApp', 'Google', 'Instagram'], [35, 30, 25, 10]) });
      }
      if (cust && rnd() < 0.014) {
        const opened = addHours(date, rf(20, 90));
        if (opened <= NOW) {
          const cat = sale.error ? 'Pedido errado' : wpick(COMP_CATS, [30, 15, 20, 10, 8, 15, 2]);
          const D = { 'Produto com defeito': 'Costura soltou depois de poucos usos.', 'Atendimento': 'Cliente não foi bem atendido no balcão.', 'Atraso na entrega': 'Pedido chegou depois do prazo combinado.', 'Pedido errado': 'Recebeu produto diferente do comprado.', 'Preço ou cobrança': 'Cobrado valor diferente da etiqueta.', 'Troca ou devolução': 'Dificuldade para trocar o tamanho.', 'Outro': 'Reclamação geral.' };
          const res = addHours(opened, rf(1, rnd() < 0.2 ? 120 : 40));
          const open = res > NOW || diffDays(opened.slice(0, 10), T) < 4 && rnd() < 0.7;
          st.complaints.push({ id: uid(), openedAt: opened, customerId: cust.id, saleId: sale.id, category: cat, description: D[cat], status: open ? (rnd() < 0.5 ? 'aberta' : 'andamento') : 'resolvida', resolvedAt: open ? null : res, resolution: open ? '' : pick(['Troca realizada', 'Devolução do valor', 'Cupom de desconto na próxima compra', 'Pedido de desculpas e reenvio']) });
        }
      }
    }
    // sangria e fechamento do caixa
    if (sess) {
      const cashSales = sum(st.sales.filter(s => s.cashSessionId === sess.id && s.status !== 'cancelada'), s => s.total);
      if (cashSales > 450 && rnd() < 0.6) sess.movements.push({ id: uid(), type: 'sangria', amount: r2(Math.floor(cashSales * 0.6 / 50) * 50), note: 'Depósito no banco', at: day + 'T15:3' + ri(0, 9), user: sess.openedBy });
      if (!isToday) {
        const x = cashExpected(sess);
        const rr = rnd();
        let dif = rr < 0.8 ? 0 : rr < 0.93 ? -r2(rf(2, 45)) : r2(rf(1, 15));
        if (sess.openedBy === 'Bruno Lima' && rnd() < 0.06) dif = -r2(rf(40, 90));
        sess.closedAt = day + 'T19:' + pad(ri(5, 40)); sess.closedBy = sess.openedBy; sess.closedById = sess.openedById;
        sess.expectedAmount = x.expected; sess.countedAmount = r2(x.expected + dif); sess.difference = dif;
        if (Math.abs(dif) >= 0.01) st.ledger.push({ id: uid(), type: dif < 0 ? 'out' : 'in', date: day, amount: Math.abs(dif), categoryId: dif < 0 ? 'quebra' : 'sobra', description: (dif < 0 ? 'Falta' : 'Sobra') + ' no fechamento do caixa de ' + fd(day), status: 'pago', paidDate: day, dueDate: day, cashId: sess.id, createdAt: sess.closedAt });
        audit(sess.closedAt, sess.closedBy, 'fechou', 'Caixa', 'Fechamento: esperado ' + fm(x.expected) + ', contado ' + fm(sess.countedAmount) + (Math.abs(dif) >= 0.01 ? ', diferença ' + fm(dif) : ', sem diferença'), sess.id);
      }
    }
    // reposição de estoque
    if (!isToday) {
      const bySup = new Map();
      for (const p of st.products) {
        if (openPO.has(p.id)) continue;
        if (noReorder.has(p.id) && d > DAYS - 40) continue;
        if (tightReorder.has(p.id) && d > DAYS - 9) continue;
        if (p.stock <= p.minStock) { const q = Math.max(p.minStock, Math.round(p._init * 1.15 - p.stock)); if (!bySup.has(p.supplierId)) bySup.set(p.supplierId, []); bySup.get(p.supplierId).push({ productId: p.id, qty: q, unitCost: r2(p._base * rf(0.95, 1.02)) }); }
      }
      for (const [sup, items] of bySup) newPurchase(sup, d, items);
    }
    // marketing
    if (wd === 1) st.ledger.push({ id: uid(), type: 'out', date: day, amount: r2(rf(150, 260)), categoryId: 'marketing', channelId: 'insta', campaign: d > DAYS - 45 ? 'Coleção primavera' : d > DAYS - 100 ? 'Liquida de inverno' : 'Novidades da semana', description: 'Anúncio Instagram', status: 'pago', paidDate: day, dueDate: day, createdAt: day + 'T08:30' });
    if (+day.slice(8) === 2) st.ledger.push({ id: uid(), type: 'out', date: day, amount: r2(rf(560, 720)), categoryId: 'marketing', channelId: 'google', campaign: 'Google Meu Negócio e pesquisa', description: 'Anúncio Google', status: 'pago', paidDate: day, dueDate: day, createdAt: day + 'T08:30' });
    if (wd === 4 && d % 14 < 7) st.ledger.push({ id: uid(), type: 'out', date: day, amount: r2(rf(110, 180)), categoryId: 'marketing', channelId: 'face', campaign: 'Remarketing', description: 'Anúncio Facebook', status: 'pago', paidDate: day, dueDate: day, createdAt: day + 'T08:30' });
    if (wd === 3 && d > DAYS - 60 && d % 14 < 7) st.ledger.push({ id: uid(), type: 'out', date: day, amount: r2(rf(140, 220)), categoryId: 'marketing', channelId: 'tiktok', campaign: 'Teste TikTok', description: 'Anúncio TikTok', status: 'pago', paidDate: day, dueDate: day, createdAt: day + 'T08:30' });
    // faltas e atrasos
    if (wd !== 0) for (const e of st.employees) { const r0 = rnd(); if (r0 < 0.008) st.absences.push({ id: uid(), employeeId: e.id, kind: 'falta', date: day, hours: 8, justified: rnd() < 0.6, reason: pick(['Atestado médico', 'Problema familiar', 'Sem justificativa']) }); else if (r0 < 0.03) st.absences.push({ id: uid(), employeeId: e.id, kind: 'atraso', date: day, hours: r2(pick([0.5, 1, 1, 1.5])), justified: rnd() < 0.3, reason: pick(['Trânsito', 'Ônibus atrasou', '']) }); }
  }

  // contas fixas (recorrências) e despesas mensais
  const startM = monthKey(START);
  const REC = [['Aluguel da loja', 'aluguel', 3200, 5], ['Internet e telefone', 'internet', 149.9, 10], ['Contador', 'contador', 480, 10], ['Sistema de cartão e assinaturas', 'sistemas', 119.9, 15], ['Pró-labore — Ana Souza', 'prolabore', 3500, 5], ['Tarifa da conta PJ', 'tarifas', 89, 1]];
  for (const [desc, cat, amount, day] of REC) st.recurrences.push({ id: uid(), type: 'out', description: desc, categoryId: cat, amount, day, startMonth: startM, active: true, skip: [] });
  materializeRecurring(true);
  for (const e of st.ledger) if (e.recId && e.dueDate <= T) { const lateDays = e.categoryId === 'internet' && e.recMonth === monthKey(T) ? 99 : 0; if (!lateDays) { e.status = 'pago'; e.paidDate = e.dueDate; } }
  let m = startM;
  while (m <= monthKey(T)) {
    const mk = m; const d1 = mk + '-01';
    const add = (day, cat, amount, desc, extra = {}) => { const date = mk + '-' + pad(day); if (date < START) return; const paid = date <= T; st.ledger.push({ id: uid(), type: 'out', date: extra.date || date, amount: r2(amount), categoryId: cat, description: desc, status: paid ? 'pago' : 'pendente', paidDate: paid ? date : null, dueDate: date, createdAt: date + 'T09:00', ...extra }); };
    add(12, 'energia', rf(430, 620), 'Conta de energia');
    add(18, 'energia', rf(70, 110), 'Conta de água');
    add(8, 'embalagens', rf(240, 380), 'Sacolas, etiquetas e papel de seda');
    add(20, 'manutencao', rf(110, 210), 'Limpeza e manutenção');
    if (m > startM) {
      const prev = monthKey(addMonths(d1, -1));
      const pc = calc({ from: prev + '-01', to: monthEnd(prev + '-01') });
      add(20, 'impostos', pc.taxes, 'DAS Simples Nacional ' + monthShort(prev));
      for (const e of st.employees) {
        const v = e.salary * (1 + e.chargesPct / 100) + e.benefits;
        const pd = mk + '-05';
        if (pd > T) continue;
        st.ledger.push({ id: uid(), type: 'out', date: monthEnd(prev + '-01'), amount: r2(v), categoryId: 'salarios', description: 'Folha ' + monthShort(prev) + ' — ' + e.name, employeeId: e.id, payroll: prev, status: 'pago', paidDate: pd, dueDate: pd, createdAt: pd + 'T10:00' });
        const cm = sum(st.sales.filter(s => s.employeeId === e.id && s.status !== 'cancelada' && monthKey(s.date) === prev), s => s.commission);
        if (cm > 0) st.ledger.push({ id: uid(), type: 'out', date: pd, amount: r2(cm), categoryId: 'comissoes', description: 'Comissão ' + monthShort(prev) + ' — ' + e.name, employeeId: e.id, status: 'pago', paidDate: pd, dueDate: pd, createdAt: pd + 'T10:00' });
      }
      audit(mk + '-05T10:00', 'Ana Souza', 'lançou', 'Folha de pagamento', monthLabel(prev) + ': 3 funcionários');
      if (mk + '-25' <= T) add(25, 'retirada', 2500, 'Retirada de lucro');
    }
    m = monthKey(addMonths(d1, 1));
  }
  // folha do mês corrente como conta a pagar
  const cmk = monthKey(T);
  for (const e of st.employees) { const pd = monthKey(addMonths(T, 1)) + '-05'; st.ledger.push({ id: uid(), type: 'out', date: T, amount: r2(e.salary * (1 + e.chargesPct / 100) + e.benefits), categoryId: 'salarios', description: 'Folha ' + monthShort(cmk) + ' — ' + e.name, employeeId: e.id, payroll: cmk, status: 'pendente', paidDate: null, dueDate: pd, createdAt: NOW }); }

  // investimentos
  const inv = [['Reforma da vitrine e iluminação', 6000, 40, 9400, 'Aumento das vendas de balcão depois da reforma'], ['Treinamento de vendas da equipe', 900, 95, 2100, 'Ticket médio subiu nas semanas seguintes'], ['Maquininha própria com taxa menor', 480, 120, 1150, 'Economia nas taxas de cartão']];
  for (const [name, amount, dd, ret, notes] of inv) { const date = addDays(START, dd); const n = { id: uid(), name, amount, date, returnAmount: ret, notes }; st.investments.push(n); st.ledger.push({ id: uid(), type: 'out', date, amount, categoryId: 'investimento', description: 'Investimento: ' + name, status: 'pago', paidDate: date, dueDate: date, investmentId: n.id, createdAt: date + 'T09:00' }); }

  // perdas
  const LS_ = [[30, 'furto', 'p22', 1, 'Óculos sumiu do expositor'], [58, 'avaria', 'p17', 1, 'Sandália manchada no estoque'], [77, 'erro', null, 0, 'Troco dado a mais', 50], [101, 'furto', 'p23', 2, 'Brincos furtados do balcão'], [129, 'fraude', null, 0, 'Comprovante de Pix falso', 189.9], [150, 'avaria', 'p5', 1, 'Blusa rasgada no provador'], [171, 'furto', 'p20', 1, 'Cinto sem etiqueta no fechamento']];
  for (const [dd, type, pid, qty, desc, amt] of LS_) {
    const date = addDays(START, dd); const p = pid ? st.products.find(x => x.id === pid) : null;
    const amount = r2(amt || (p ? p.cost * qty : 0));
    const l = { id: uid(), date, type, productId: pid, qty, amount, description: desc, user: 'Ana Souza', createdAt: date + 'T18:00' };
    st.losses.push(l);
    if (p && p.stock >= qty) addMove(p.id, -qty, 'perda', l.id, p.cost, lossName(type) + ': ' + desc, date + 'T18:00');
    else if (!p) st.ledger.push({ id: uid(), type: 'out', date, amount, categoryId: 'perda', description: lossName(type) + ': ' + desc, status: 'pago', paidDate: date, dueDate: date, lossId: l.id, createdAt: date + 'T18:00' });
    audit(date + 'T18:00', 'Ana Souza', 'registrou', 'Perda', lossName(type) + ' — ' + fm(amount) + ': ' + desc, l.id);
  }
  // contagens de estoque
  for (const dd of [60, DAYS - 20]) {
    const date = addDays(START, dd) + 'T20:00';
    const items = st.products.map(p => { const after = sum(st.moves.filter(mv => mv.productId === p.id && mv.date > date), mv => mv.qty); const sys = r2(p.stock - after); let cnt = sys; if (rnd() < 0.16 && sys > 0) cnt = sys - ri(1, 2); if (rnd() < 0.03) cnt = sys + 1; return { productId: p.id, name: p.name, systemQty: sys, countedQty: Math.max(0, cnt), unitCost: p.cost }; });
    const ct = { id: uid(), date, user: 'Ana Souza', items, applied: true };
    st.counts.push(ct);
    for (const it of items) { const d = it.countedQty - it.systemQty; if (d) addMove(it.productId, d, 'inventario', ct.id, it.unitCost, 'Contagem de ' + fd(date), date); }
    audit(date, 'Ana Souza', 'registrou', 'Contagem de estoque', plural(items.length, 'item contado', 'itens contados') + ', ' + plural(items.filter(i => i.countedQty !== i.systemQty).length, 'divergência', 'divergências'), ct.id);
  }
  // ajustes manuais e alterações de preço no histórico
  audit(addDays(T, -12) + 'T17:40', 'Bruno Lima', 'ajustou', 'Estoque', 'Camiseta estampada: −1 (peça com defeito)');
  audit(addDays(T, -35) + 'T09:10', 'Ana Souza', 'editou', 'Produto', 'Tênis casual branco — preço R$ 259,90 → R$ 279,90');
  audit(addDays(T, -64) + 'T09:12', 'Ana Souza', 'editou', 'Configurações', 'Parâmetros financeiros (taxRate: 5 → 6)');
  // pedidos de hoje e de ontem ainda em aberto
  for (const s of st.sales.filter(s => s.fulfillment && s.date >= addDays(T, -1) && s.status !== 'cancelada')) { if (rnd() < 0.6) { s.fulfillment.deliveredAt = null; if (rnd() < 0.5) s.fulfillment.processedAt = null; s.fulfillment.status = s.fulfillment.processedAt ? 'enviado' : 'novo'; } }
  const lateOne = st.sales.filter(s => s.fulfillment && s.date.slice(0, 10) === addDays(T, -2) && s.status !== 'cancelada')[0];
  if (lateOne) { lateOne.fulfillment.deliveredAt = null; lateOne.fulfillment.status = 'enviado'; }
  // metas
  let gm = startM; let k = 0;
  while (gm <= monthKey(addMonths(T, 2))) { const rv = 50000 + k * 1800; st.goals[gm] = { revenue: rv, profit: Math.round(rv * 0.17 / 100) * 100 }; gm = monthKey(addMonths(gm + '-01', 1)); k++; }
  // acessos
  for (let d = DAYS - 6; d <= DAYS; d++) { const day = addDays(START, d); audit(day + 'T08:55', 'Ana Souza', 'entrou', 'Acesso', 'Ana Souza entrou no sistema'); }

  for (const p of st.products) { delete p._w; delete p._init; delete p._base; }
  for (const c of st.customers) { delete c._join; delete c._loy; }
  for (const p of st.purchases) delete p._arrive;
  st.audit.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  st.meta.demo = true; st.meta.setupDone = true; st.meta.rev = 1;
  CUR = null;
  S = prevS; invalidate();
  return st;
}
