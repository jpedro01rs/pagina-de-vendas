/**
 * Service worker: faz o app abrir instantaneo e continuar util sem sinal.
 *
 * Estrategia:
 *  - arquivos do app (html/css/js/icones): cache primeiro, rede depois;
 *  - chamadas de dados (/api/): rede primeiro, cache como reserva.
 *
 * A segunda regra e a que importa na pratica: se voce esta numa loja com
 * sinal ruim, ainda ve a ultima tabela de precos que carregou.
 */
const VERSAO = 'radar-v1';
// Relativos de proposito: o app roda tanto na raiz (servidor local) quanto
// em subpasta (GitHub Pages, /pagina-de-vendas/).
const CASCA = ['./', 'index.html', 'styles.css', 'app.js', 'manifest.json',
  'icones/icone-192.png', 'icones/icone-512.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSAO).then((cache) => cache.addAll(CASCA)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== VERSAO).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const { request } = evento;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Login e diagnostico nunca vem do cache.
  if (url.pathname.endsWith('/entrar') || url.pathname.endsWith('/api/saude')) return;

  if (url.pathname.includes('/api/')) {
    evento.respondWith(
      fetch(request)
        .then((resposta) => {
          const copia = resposta.clone();
          caches.open(VERSAO).then((cache) => cache.put(request, copia));
          return resposta;
        })
        .catch(() => caches.match(request).then((cache) => cache || new Response(
          JSON.stringify({ erro: 'Sem conexao e sem dados salvos para esta tela.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        ))),
    );
    return;
  }

  evento.respondWith(
    caches.match(request).then((cache) => cache || fetch(request).then((resposta) => {
      if (resposta.ok) {
        const copia = resposta.clone();
        caches.open(VERSAO).then((c) => c.put(request, copia));
      }
      return resposta;
    })),
  );
});
