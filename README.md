# Revenda Radar

Ferramenta de precificação e garimpo de oportunidades para quem compra usado e revende.

Ela consulta **OLX**, **Enjoei** e (opcionalmente) **Facebook Marketplace** ao vivo, calcula o preço
real de mercado de cada item e aponta os anúncios que estão baratos o bastante para você comprar,
revender um pouco abaixo da média e girar rápido.

---

## O que ela responde

| Pergunta | Onde aparece |
|---|---|
| Quanto vale hoje um iPhone 13 usado? | **Preço de mercado** (mediana) |
| Qual o máximo que posso pagar e ainda lucrar? | **Pague até** (teto de compra) |
| Por quanto anuncio para vender rápido? | **Venda por** |
| Onde tem anúncio barato perto de mim agora? | Aba **Oportunidades** |
| Compensa comprar na OLX e vender no Enjoei? | Bloco **Arbitragem entre plataformas** |
| Esse preço baixo é pechincha ou golpe? | Etiqueta de **risco** no anúncio |

---

## Como abrir o app

O app roda **no seu computador**, não num site. É proposital: a OLX bloqueia acesso vindo de
servidor, então a busca precisa sair da sua internet.

**1. Instale o [Node.js](https://nodejs.org)** (botão LTS, instalação normal, avançar até o fim).

**2. Baixe o projeto.** No GitHub: botão verde **Code → Download ZIP**, e descompacte.
Ou, se tiver git:

```bash
git clone https://github.com/jpedro01rs/pagina-de-vendas.git
cd pagina-de-vendas
git checkout claude/reselling-price-comparison-app-1gt8od
```

**3. Abra o terminal na pasta do projeto e rode:**

```bash
npm run comecar
```

Esse comando faz tudo sozinho: instala as dependências, baixa o navegador, cria a configuração,
sobe o servidor e abre a página. Da segunda vez em diante, só `npm start`.

> **Como abrir o terminal na pasta:**
> **Windows** — abra a pasta no Explorer, clique na barra de endereço, digite `cmd` e Enter.
> **Mac** — clique com o botão direito na pasta e escolha *Novo Terminal na Pasta*.

---

## Primeiro uso, dentro do app

1. Aba **Configuração** → preencha **estado e cidade** e clique em *Salvar configuração*.
   É isso que faz o app achar oportunidades perto de você.
2. Aba **Tabela de preços** → clique em **Atualizar tabela**.
   Comece por uma categoria só (filtro *Videogames*, depois *Atualizar só esta categoria*) —
   é bem mais rápido que o catálogo inteiro.
3. Aba **Oportunidades** → o que comprar agora, com lucro e ROI calculados.

Quer consultar uma coisa só, sem esperar o catálogo? Aba **Buscar item**, digite e busque.

Se alguma fonte não trouxer nada, rode no terminal:

```bash
npm run doctor
```

Ele faz uma busca real e mostra, fonte por fonte, quantos anúncios voltaram, quais foram
descartados e por quê.

---

## Como usar no dia a dia

- **Tabela de preços** — o preço de mercado de todo o catálogo. Clique numa linha para ver
  percentis, quebra por plataforma, por armazenamento e a lista de anúncios.
- **Buscar item** — qualquer coisa, na hora: `bicicleta aro 29`, `air fryer`, `MacBook Pro M3`.
  Não precisa estar no catálogo.
- **Oportunidades** — o resumo do que comprar agora, com lucro, ROI e capital necessário.
- **Configuração** — o que está valendo e como mudar.

Pelo terminal, sem abrir a interface:

```bash
npm run buscar -- "iphone 13 pro"
```

---

## Como os números são calculados

**O preço de mercado é a MEDIANA, não a média.** Um anúncio de "iPhone 12 — R$ 99.999" destruiria
uma média; na mediana ele não muda quase nada. Antes disso, preços fora da curva são removidos pelo
critério de Tukey (cercas do IQR).

**Filtro de relevância.** Buscar "iPhone 12" na OLX traz capinha, película, tela, aparelho com
defeito e gente que quer *comprar*. Nada disso pode entrar na conta. O filtro derruba:

- acessórios e peças, quando aparecem **antes** do modelo no título
  (`Capa para iPhone 12` sai; `iPhone 12 com capa` fica — o núcleo do anúncio é o que vem primeiro);
- defeito, bloqueio de iCloud, sucata, conserto, aluguel, "compro/procuro";
- variantes erradas (`iPhone 12 Pro Max` não entra na conta do `iPhone 12`);
- preços fora de uma faixa de sanidade por produto.

**Teto de compra.** O maior preço que ainda entrega o seu ROI mínimo:

```
receita  = mediana × (1 − desconto de venda rápida) × (1 − taxa da plataforma)
teto     = receita ÷ (1 + ROI mínimo) − custo fixo
```

**Score da oportunidade (0–100).** Combina desconto sobre a mediana (50%), tamanho da amostra (20%),
liquidez do item (15%) e proximidade da sua cidade (15%). Anúncios muito abaixo do mercado são
penalizados: abaixo de 55% da mediana quase sempre é golpe, peça ou aparelho bloqueado — a
ferramenta mostra, mas marca como **risco alto**.

---

## Configuração

O jeito normal é pela **aba Configuração** do app — vale na hora, sem reiniciar. O que você salvar
ali fica em `data/config.json` e tem prioridade sobre o `.env`.

O `.env` continua servindo para o que não muda no dia a dia (porta, tempo de espera entre
requisições, cache):

| Variável | O que faz | Padrão |
|---|---|---|
| `UF`, `REGIAO`, `CIDADE` | Sua região. Filtra a busca e ranqueia proximidade. | — |
| `DESCONTO_VENDA_RAPIDA` | Quanto abaixo da mediana você anuncia para girar. `0.08` = 8%. | `0.08` |
| `CUSTO_FIXO` | Transporte, limpeza, embalagem por operação. | `30` |
| `TAXA_PLATAFORMA` | Comissão na venda. `0` presencial, `0.20` para Enjoei. | `0` |
| `LUCRO_MINIMO` | Abaixo disso não vira oportunidade. | `100` |
| `ROI_MINIMO` | Retorno mínimo sobre o capital. | `0.12` |
| `MAX_PAGINAS` | Páginas coletadas por busca. Mais páginas = amostra melhor e mais lento. | `2` |
| `DELAY_MS` | Intervalo entre requisições. **Não abaixe muito** ou você é bloqueado. | `1500` |
| `CACHE_MIN` | Por quantos minutos um resultado é reaproveitado. | `180` |
| `FONTE_OLX` / `FONTE_ENJOEI` / `FONTE_FACEBOOK` | Liga e desliga cada fonte. | `true`/`true`/`false` |

Ajustes feitos pela tela valem na hora. Se editar o `.env` na mão, reinicie com `npm start`.

---

## Facebook Marketplace (opcional, leia antes)

Vem **desligado de propósito**. O Marketplace exige login e o Facebook proíbe coleta automatizada
nos termos de uso — automatizar pode levar a **restrição ou bloqueio da sua conta**.

Se ainda assim quiser usar, a fonte funciona com o **seu** navegador e a **sua** sessão:

```bash
npm run doctor -- --login-facebook   # abre o navegador, você loga na mão (uma vez só)
```

Depois ponha `FONTE_FACEBOOK=true` no `.env`. A sessão fica em `data/perfil-facebook/`.
A decisão e o risco são seus.

---

## Ajustando o catálogo

O catálogo (70 produtos: iPhone 7 até 17, PlayStation 2 a 5, Xbox 360 até Series X, Switch, iPad,
MacBook, Galaxy, Redmi) fica em **`src/catalog/index.js`**. Para incluir um item:

```js
{
  nome: 'Xiaomi Poco X6',
  categoria: 'Celulares',
  consultas: ['poco x6'],           // o que é digitado na busca
  padrao: '\\bpoco\\s*x6\\b',        // identifica o modelo no título
  proibir: ['pro'],                  // não confundir com o X6 Pro
  faixa: [800, 2500],                // guarda de sanidade em R$
}
```

`faixa` **não é avaliação de preço** — é só um limite para descartar peça solta e golpe. O preço real
sempre vem da coleta.

---

## Quando algo dá errado

| Sintoma | O que fazer |
|---|---|
| `HTTP 403` na OLX | Anti-robô. Rode `npm run navegador`. Se persistir, aumente `DELAY_MS` e espere. |
| "respondeu, mas NÃO trouxe anúncios" | O site mudou de layout. O extrator tem plano B, mas pode precisar de ajuste. |
| "Amostra insuficiente" | Item raro na sua região. Limpe `REGIAO` no `.env` para buscar no estado ou no país. |
| Aparecem itens errados na conta | Ajuste `exigir` / `proibir` / `faixa` daquele produto no catálogo. |
| Facebook pedindo login | `npm run doctor -- --login-facebook` |

Para conferir que a matemática está correta (percentis, outliers, lucro, teto de compra):

```bash
npm run selftest
```

---

## Limites que você deve conhecer

- **A coleta é lenta de propósito.** Uma pausa entre requisições é o que evita bloqueio. O catálogo
  inteiro leva de 10 a 25 minutos, dependendo de `MAX_PAGINAS`.
- **Preço de anúncio não é preço de venda.** A mediana reflete o que os vendedores *pedem*.
  Na prática se fecha abaixo disso — o desconto de venda rápida já compensa parte.
- **Amostra pequena engana.** Confie nas linhas com confiança **Alta** (25+ anúncios).
- **A ferramenta não valida procedência.** Ela aponta preço; conferir IMEI, nota fiscal e estado do
  aparelho continua sendo com você.
- **Os sites mudam.** Se uma fonte parar de trazer dados, `npm run doctor` diz qual e por quê.

Use para consulta pessoal, mantenha o intervalo entre requisições e respeite os termos de uso de cada
plataforma.

---

## Estrutura do projeto

```
src/
  catalog/     produtos monitorados e regras de identificação
  sources/     coletores: olx.js, enjoei.js, facebook.js
  pipeline/    filtro.js (relevância) · estatistica.js (mediana, IQR) · oportunidades.js (lucro, score)
  lib/         http, navegador, extrator de JSON, texto/preços
  services/    orquestração da análise
  jobs/        atualização do catálogo
  server.js    API + interface
public/        interface web
bin/           doctor · buscar · atualizar · selftest
data/          snapshots e histórico (criado no primeiro uso)
```
