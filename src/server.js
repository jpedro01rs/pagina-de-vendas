import express from 'express';
import path from 'node:path';
import config, { ROOT, salvarAjustes } from './config.js';
import { CATALOGO, categorias, buscarProduto } from './catalog/index.js';
import { listarFontes } from './sources/index.js';
import { analisarProduto, buscarTermo, tabelaDePrecos, melhoresOportunidades } from './services/mercado.js';
import { lerSnapshot, lerHistorico } from './store.js';
import { atualizarCatalogo, estadoAtual, emAndamento } from './jobs/atualizar.js';
import { playwrightDisponivel } from './lib/navegador.js';

const app = express();
app.use(express.json());
app.use(express.static(path.join(ROOT, 'public')));

/** Envolve rota async devolvendo erro em JSON em vez de derrubar o processo. */
const rota = (manipulador) => (req, res) => {
  Promise.resolve(manipulador(req, res)).catch((erro) => {
    console.error(`[erro] ${req.method} ${req.path}:`, erro.message);
    if (!res.headersSent) res.status(500).json({ erro: erro.message });
  });
};

app.get('/api/config', rota(async (req, res) => {
  res.json({
    regiao: config.regiao,
    negocio: config.negocio,
    coleta: { maxPaginas: config.coleta.maxPaginas, cacheMin: config.cacheMin },
    fontes: listarFontes(),
    navegador: await playwrightDisponivel(),
    categorias: categorias(),
    totalProdutos: CATALOGO.length,
  });
}));

app.post('/api/config', rota((req, res) => {
  const atualizado = salvarAjustes(req.body || {});
  res.json({ salvo: true, regiao: atualizado.regiao, negocio: atualizado.negocio, fontes: atualizado.fontes });
}));

app.get('/api/catalogo', rota((req, res) => {
  res.json(CATALOGO.map(({ id, nome, categoria, marca, faixa }) => ({ id, nome, categoria, marca, faixa })));
}));

app.get('/api/tabela', rota((req, res) => {
  const { categoria, comDados } = req.query;
  let linhas = tabelaDePrecos();
  if (categoria) linhas = linhas.filter((l) => l.categoria === categoria);
  if (comDados === 'true') linhas = linhas.filter((l) => !l.semDados);
  res.json({ linhas, atualizacao: estadoAtual() });
}));

app.get('/api/produto/:id', rota(async (req, res) => {
  const produto = buscarProduto(req.params.id);
  if (!produto) return res.status(404).json({ erro: 'Produto nao encontrado no catalogo.' });

  const forcar = req.query.atualizar === 'true';
  const existente = lerSnapshot(req.params.id);
  if (!forcar && existente) return res.json({ ...existente, doCache: true });

  const resultado = await analisarProduto(req.params.id, { forcar });
  res.json(resultado);
}));

app.get('/api/buscar', rota(async (req, res) => {
  const termo = String(req.query.q || '').trim();
  if (termo.length < 2) return res.status(400).json({ erro: 'Digite ao menos 2 caracteres.' });

  // Tres coisas distintas, de proposito:
  //   uf/regiaoSlug -> filtram a busca na origem (URL da OLX)
  //   regiao{}      -> ranqueia proximidade na hora de pontuar oportunidades
  const uf = String(req.query.uf || config.regiao.uf || '').toLowerCase();
  const cidade = req.query.cidade || config.regiao.cidade;

  res.json(await buscarTermo(termo, {
    forcar: req.query.atualizar === 'true',
    uf,
    regiaoSlug: req.query.regiao ?? config.regiao.slug,
    cidade,
    regiao: { uf, cidade },
    fontes: req.query.fontes ? String(req.query.fontes).split(',') : null,
  }));
}));

app.get('/api/oportunidades', rota((req, res) => {
  res.json({
    oportunidades: melhoresOportunidades({
      limite: Number(req.query.limite) || 60,
      riscoMaximo: req.query.risco || 'medio',
    }),
  });
}));

app.get('/api/historico/:id?', rota((req, res) => {
  res.json(lerHistorico(req.params.id || null));
}));

app.post('/api/atualizar', rota(async (req, res) => {
  if (emAndamento()) return res.status(409).json({ erro: 'Ja existe uma atualizacao em andamento.', estado: estadoAtual() });
  const { ids, categoria } = req.body || {};

  // Responde na hora: a coleta continua rodando em segundo plano.
  atualizarCatalogo({ ids, categoria }).catch((erro) => console.error('[atualizacao]', erro.message));
  res.status(202).json({ iniciado: true, estado: estadoAtual() });
}));

app.get('/api/atualizar/status', rota((req, res) => res.json(estadoAtual())));

app.get('/api/saude', rota((req, res) => res.json({ ok: true, versao: '1.0.0' })));

const servidor = app.listen(config.porta, () => {
  console.log(`\n  Revenda Radar rodando em http://localhost:${config.porta}`);
  console.log(`  Regiao: ${config.regiao.cidade || 'nao definida'} (${(config.regiao.uf || '--').toUpperCase()})`);
  console.log(`  Fontes ativas: ${listarFontes().filter((f) => f.ativa).map((f) => f.nome).join(', ') || 'nenhuma'}`);
  console.log(`  Catalogo: ${CATALOGO.length} produtos\n`);
});

process.on('SIGINT', () => { servidor.close(() => process.exit(0)); });
export default app;
