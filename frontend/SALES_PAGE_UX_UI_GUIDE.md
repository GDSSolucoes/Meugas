# Guia de UX/UI da SalesPage

Este documento descreve os padrões visuais e de interação observados na tela de vendas. Use-o como referência para criar novas páginas com a mesma linguagem visual.

Fontes principais: [Sales.jsx](src/pages/Sales.jsx), [ProductEntryPanel.jsx](src/components/products/ProductEntryPanel.jsx), [ProductItemsTable.jsx](src/components/products/ProductItemsTable.jsx) e [ProductSearchDialog.jsx](src/components/products/ProductSearchDialog.jsx).

## 1. Direção visual

- Interface operacional, clara e orientada a formulário.
- Fundo geral em cinza azulado claro: `bg-slate-100`.
- Conteúdo branco em blocos separados por espaço vertical, sem bordas decorativas excessivas.
- Azul escuro para títulos contextuais e seções importantes: `#1E3A8A` ou `#223f61`.
- Laranja para ações primárias de continuidade: `#e78b3a`.
- Verde para sucesso, total a pagar e registro selecionado: `#F0FDF4`, `#BBF7D0`, `#15803D` e `#10B981`.
- Vermelho para erro, remoção, cancelamento ou campos obrigatórios: `#EF4444`/`text-red-500`.
- Tipografia compacta: labels em `text-xs`, textos de tabela em `text-xs` ou `text-sm`, títulos de seção em `text-sm` e título de página em `text-3xl`.

## 2. Container da página

Estrutura recomendada:

```jsx
<div className="min-h-screen bg-slate-100">
  <div className="max-w-[1400px] mx-auto p-6">{/* título e seções */}</div>
</div>
```

Características:

- `min-h-screen` garante que o fundo cubra toda a viewport.
- `max-w-[1400px]` limita a largura em monitores grandes e mantém os campos legíveis.
- `mx-auto` centraliza o conteúdo.
- `p-6` cria respiro de 24px nas bordas.
- As seções usam `mb-4`, mantendo 16px entre cards consecutivos.
- O layout é responsivo por meio de grids que começam em uma coluna e passam a múltiplas colunas em `md`.

Não criar um segundo card envolvendo todos os cards. O container da página é apenas estrutural; cada etapa do formulário deve ser um bloco próprio.

## 3. Cabeçalho

O cabeçalho é simples e textual:

```jsx
<h1 className="text-3xl font-bold text-slate-800 mb-6">Vendas</h1>
```

Regras observadas:

- Um único `h1` no início da área de conteúdo.
- `text-3xl`, `font-bold` e `text-slate-800` dão destaque sem usar uma área hero.
- `mb-6` separa o título da primeira seção.
- O texto muda quando a página está em modo de edição: `Manutenção de Venda #...`.
- O cabeçalho não possui card, ícone ou barra colorida própria.

## 4. Cards e seções

### 4.1 Card padrão

As seções principais usam `Card` e `CardContent`:

```jsx
<Card
  className="mb-4"
  style={{
    background: "white",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  }}
>
  <CardContent className="p-4">...</CardContent>
</Card>
```

O primitive `Card` já fornece `rounded-xl border bg-card text-card-foreground shadow`. Na SalesPage, o conteúdo substitui o espaçamento padrão de `CardContent` por `p-4`, resultando em um bloco compacto.

Características:

- Fundo branco.
- Canto arredondado médio (`rounded-xl` herdado do primitive).
- Borda cinza discreta e sombra curta.
- Padding interno de 16px.
- Margem inferior de 16px.
- Sem cabeçalho de card padrão; os labels e títulos ficam dentro do conteúdo.

### 4.2 Seção de pedido ou metadados

- Grid inicial: `grid grid-cols-1 md:grid-cols-3 gap-4`.
- Em edição, o grid reduz para `md:grid-cols-2`.
- Cada campo tem label pequeno, peso médio, cor `#374151` e controle com `mt-1`.
- Campos obrigatórios exibem `*` em `text-red-500`.
- Selects e inputs ocupam a largura natural da coluna.

### 4.3 Seção de produtos

Composição:

1. Painel de entrada de produto.
2. Tabela de itens adicionados.

O painel usa `grid grid-cols-1 md:grid-cols-12 gap-3 items-end mb-4`. As colunas são distribuídas por função: produto ocupa 3/12, quantidade 1/12, preço 2/12, descrição 2/12, desconto 2/12 e ação 2/12.

O campo de descrição é somente leitura e usa `bg-slate-50`, comunicando que ele é preenchido pela seleção do produto.

### 4.4 Tabelas

Use uma moldura simples para a tabela:

```jsx
<div className="border rounded-lg overflow-hidden">
  <Table>...</Table>
</div>
```

Padrões:

- Cabeçalho com `bg-slate-50`.
- Cabeçalhos em `text-xs font-semibold`.
- Valores em `text-sm` ou `text-xs` quando a tabela estiver dentro de um modal.
- Valores monetários alinhados à direita.
- Coluna de ações alinhada à direita.
- Campos editáveis dentro da tabela com largura fixa (`w-20`, `w-16`) para evitar deslocamento das colunas.
- Estado vazio centralizado, com `py-8 text-center text-sm text-slate-500`.
- Ação de remoção usa botão `ghost` com ícone `Trash2` e texto vermelho.

## 5. Labels, campos e controles

- Labels de formulário: `text-xs font-medium`, normalmente em `#374151`.
- Títulos internos: `text-sm font-semibold`.
- Inputs, selects e textareas recebem `mt-1` quando vêm logo após o label.
- Textarea de observações usa `rows={3}` e placeholder orientativo.
- Campos de busca combinam input flexível com botão de ícone.
- Botões somente com ícone devem ter `title` e `aria-label` quando o significado não for óbvio pelo contexto.
- Use `Select` para conjuntos fechados de opções e `Input` para busca ou valores livres.

## 6. Botões e hierarquia de ações

O primitive `Button` fornece altura, radius, tipografia, foco visível, estados disabled e suporte a ícones Lucide.

### Ação primária

- Fundo laranja `#e78b3a`.
- Texto branco.
- Ícone à esquerda quando a ação tiver representação clara (`Plus`, `Save`).
- Exemplos: `Adicionar`, `OK`, `Confirmar Pagamento`.

### Ação secundária

- `variant="outline"` para fechar, cancelar ou adicionar uma ação auxiliar.
- Em ações de pesquisa, preferir `size="icon"` com `Search`.

### Ação destrutiva ou de limpeza

- Botão `ghost` com texto/ícone vermelho.
- Exemplos: remover item com `Trash2` e limpar cliente com `X`.
- A limpeza do cliente aparece apenas depois que há um cliente selecionado.

### Rodapé da página

O rodapé fica fora de um `Card`, em uma faixa própria:

```jsx
<div
  className="p-4 rounded-lg"
  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}
>
  <div className="flex flex-wrap gap-3 justify-center">...</div>
</div>
```

- Fundo `#F9FAFB` e borda `#E5E7EB`.
- Padding de 16px e radius `rounded-lg`.
- Ações centralizadas, com `flex-wrap` e `gap-3` para telas menores.
- A ação principal vem primeiro; cancelar vem depois.

## 7. Totais e feedback visual

O card de totais usa `grid grid-cols-1 md:grid-cols-4 gap-4`.

- Cada métrica fica em um bloco centralizado com `p-3 rounded-lg`.
- Métricas neutras usam `#F9FAFB`, label cinza `#6B7280` e valor `#1F2937`.
- O total final recebe mais ênfase: `p-4`, fundo verde claro, borda verde, label verde escuro e valor em `text-xl font-bold`.
- Estados de conferência seguem a mesma semântica: verde quando o valor está correto e vermelho quando ainda há saldo pendente.
- Feedback de validação usa toast para erros de regra de negócio, mantendo o formulário no contexto.

## 8. Modal de produtos

O modal de produtos usa o primitive acessível `Dialog`:

```jsx
<DialogContent className="max-w-2xl max-h-[80vh]">
```

Características:

- Largura máxima de `max-w-2xl`.
- Altura limitada a `80vh`.
- Overlay escuro e animação de entrada/saída herdados de `DialogContent`.
- Fechamento pelo botão padrão do primitive ou pelo botão `Fechar` no rodapé.
- Título no `DialogHeader` e ações no `DialogFooter`.
- Campo de busca com ícone `Search` posicionado dentro do input (`pl-9`).
- A busca filtra por código, nome ou categoria e limpa o termo ao abrir.
- Resultados em tabela com cabeçalho fixo (`sticky top-0`) e área rolável (`max-h-80 overflow-auto`).
- Linha selecionável com `cursor-pointer hover:bg-blue-50`.
- Duplo clique na linha ou botão `Selecionar` conclui a escolha e fecha o modal.
- Estado vazio explícito: `Nenhum produto encontrado.`

Esse é o padrão recomendado para novos modais de consulta: usar `Dialog`, tabela compacta, busca no topo, lista rolável e ação explícita de seleção.

## 9. Modal de clientes

O modal de clientes atualmente é um overlay manual:

```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
```

Características implementadas:

- Ocupa toda a viewport com `fixed inset-0`.
- Overlay preto translúcido (`bg-opacity-50`).
- Conteúdo centralizado horizontal e verticalmente.
- Painel branco, `rounded-lg`, sombra forte, largura máxima `max-w-2xl` e altura máxima `80vh`.
- `overflow-hidden` mantém cabeçalho e rodapé dentro da moldura.
- Cabeçalho azul `#1E3A8A`, padding `p-4`, borda inferior e título branco `text-lg font-semibold`.
- Corpo com `p-4`, busca no topo e lista rolável de clientes (`max-h-96 overflow-y-auto`).
- Cada cliente é uma linha clicável com `p-3 border-b cursor-pointer hover:bg-gray-50`.
- A linha exibe nome em peso médio e endereço em texto menor cinza.
- Rodapé com `p-4 border-t`, ação `Fechar` alinhada à direita.

Ao selecionar um cliente, o modal fecha e a seleção é apresentada na página em um bloco verde claro com nome, endereço e botão `X` para limpar.

### Recomendação de consistência

Ao criar novos fluxos, prefira migrar esse overlay manual para o mesmo `Dialog` usado pelo modal de produtos. O visual pode permanecer equivalente, mas o primitive compartilhado já oferece foco, fechamento, acessibilidade e animações de forma consistente.

## 10. Modal de pagamento

O modal de pagamento segue o mesmo primitive `Dialog`, com `max-w-2xl max-h-[90vh] overflow-y-auto`.

- Título azul em `text-xl font-bold`.
- Cliente em texto pequeno e total destacado em bloco verde.
- Cada forma de pagamento é um bloco `border rounded-lg bg-gray-50 p-3`.
- Campos usam `flex flex-wrap items-center gap-3`, com larguras mínimas para evitar controles estreitos.
- Parcelas aparecem em uma tabela interna branca com borda e inputs menores (`h-8 text-xs`).
- Adicionar forma de pagamento é uma ação outline laranja e ocupa toda a largura.
- Resumo usa dois blocos em `grid grid-cols-2`: total pago neutro e saldo restante com estado verde/vermelho.
- O rodapé usa `DialogFooter`; cancelar é outline e confirmar é laranja.
- Durante o salvamento, os botões ficam desabilitados e o texto primário muda para `Salvando...`.

## 11. Responsividade

- Todo grid começa em `grid-cols-1`.
- Colunas adicionais entram em `md` (`md:grid-cols-2`, `md:grid-cols-3`, `md:grid-cols-4` ou `md:grid-cols-12`).
- Grupos de ações usam `flex-wrap`.
- Modais limitam altura e usam rolagem interna.
- Tabelas e campos de edição preservam larguras mínimas/definidas.
- Evitar textos longos em botões de ícone; quando a ação precisar de texto, manter o label curto.

## 12. Checklist para novas páginas

- [ ] Fundo `min-h-screen bg-slate-100`.
- [ ] Container `max-w-[1400px] mx-auto p-6`.
- [ ] Um `h1` com `text-3xl font-bold text-slate-800 mb-6`.
- [ ] Seções separadas em cards brancos com `mb-4` e `CardContent className="p-4"`.
- [ ] Labels pequenos, campos com `mt-1` e obrigatórios marcados em vermelho.
- [ ] Grid responsivo começando em uma coluna.
- [ ] Tabelas com cabeçalho `bg-slate-50`, estado vazio e ações alinhadas à direita.
- [ ] Ações primárias em laranja e secundárias com `outline`.
- [ ] Ações destrutivas em `ghost` vermelho e com ícone Lucide.
- [ ] Totais com blocos neutros e destaque verde para o valor final.
- [ ] Modais com `Dialog`, limite de altura, busca no topo quando aplicável e rodapé explícito.
- [ ] Busca/listagem com estado vazio e área rolável.
- [ ] Verificação visual em viewport estreita e larga antes de concluir.
