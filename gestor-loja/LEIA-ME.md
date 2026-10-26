# Caixa Claro — sistema de gestão para lojas

Arquivo único (`index.html`) que roda no navegador do computador ou do celular, sem instalação, sem internet e sem mensalidade.
Os dados ficam salvos no próprio navegador do aparelho do cliente.

## O que tem

- **Nova venda (PDV)** com busca, leitor de código de barras, desconto em R$ ou %, troco, venda a prazo, pedido para entrega e comprovante para WhatsApp.
- **Caixa**: abertura, sangria, suprimento e fechamento com cálculo automático da diferença.
- **13 módulos com 52 indicadores**: financeiro, vendas, estoque, clientes, marketing, funcionários, operação, fornecedores, precificação, planejamento, segurança, satisfação e painel executivo.
- Botão **?** em cada indicador explicando a fórmula. Tela de **Ajuda** com primeiros passos, rotina e perguntas frequentes.
- **Usuários** com PIN (administrador e operador) e **histórico de operações**, que os usuários não conseguem apagar.
- **Backup e restauração**, exportação para Excel (CSV), modo claro e escuro.
- **Loja de demonstração** carregada na primeira abertura. O botão "Começar com a minha loja" apaga a demonstração e abre o assistente de configuração.

## Como entregar ao cliente

**Opção 1 — arquivo (mais simples)**
1. Envie o `index.html` (WhatsApp, e-mail ou pendrive).
2. O cliente salva o arquivo em uma pasta fixa (ex.: Documentos) e abre com o **Google Chrome** ou o **Microsoft Edge**.
3. Ele cria um favorito ou um atalho na área de trabalho. Não deve mudar o arquivo de pasta nem usar aba anônima.

**Opção 2 — link na internet (permite instalar como aplicativo)**
1. No GitHub, ative o Pages deste repositório (Settings → Pages → branch `main`, pasta raiz).
2. O endereço fica `https://<seu-usuario>.github.io/pagina-de-vendas/gestor-loja/`.
3. No Chrome e no Edge aparece a opção "Instalar aplicativo". Depois da primeira abertura, funciona sem internet.

Em qualquer opção, cada computador ou celular guarda os seus próprios dados. Para levar os dados de um aparelho para outro, use **Configurações → Backup e dados**.

## Primeiro uso (passe isso para o cliente)

1. Tocar em **Começar com a minha loja**: nome, PIN, saldo atual, imposto e meta.
2. **Configurações**: formas de pagamento com a taxa e o prazo da maquininha.
3. **Estoque → Novo produto**: custo, preço e quantidade atual.
4. **Funcionários** e **Fornecedores**.
5. **Financeiro → Contas fixas**: aluguel, internet, contador, pró-labore.
6. **Planejamento → Definir metas do ano**.
7. Vender pelo botão **Nova venda**. Fazer **backup toda semana**.

## Para quem for alterar o código

O código fica em `src/`. Depois de editar, gere o arquivo único:

```bash
./build.sh            # gera index.html
```

Na demonstração, o PIN do operador Bruno é `1234`.
