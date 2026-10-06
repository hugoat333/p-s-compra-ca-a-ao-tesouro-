# Kits dos temas (arquivos FIXOS — não são públicos)

Esta pasta fica **fora de `/public`** de propósito: as pistas só saem dentro do PDF de um pedido pago.

Cada tema precisa de exatamente 10 arquivos (`.png` preferido; `.jpg` também é aceito):

```
kits/<tema>/introducao.png     ← recebe o nome da criança
kits/<tema>/pista-01.png … pista-08.png   ← entram SEM alteração
kits/<tema>/certificado.png    ← recebe o nome da criança
kits/<tema>/capa.png           ← opcional: imagem do card de seleção (senão usa a introdução)
```

Temas (nomes de pasta obrigatórios): `dinossauros`, `espaco`, `futebol`, `princesas`, `fadas`, `sereias`.

Depois de adicionar os arquivos:

```bash
npm run kits:check      # lista exatamente o que falta
npm run kits:thumbs     # gera public/temas/<tema>.webp (cards leves da página)
npm run pdf:sample -- dinossauros "Miguel"   # gera output/… para conferência visual
```

Posição do nome: definida em `LAYOUT_OVERRIDES` (`src/lib/kits/manifest.ts`). Com as artes atuais o nome vai numa
faixa acima da arte ("Olá, {nome}!" na introdução, "Parabéns, {nome}!" no certificado), porque nenhum certificado tem
área livre — sobrepor cobriria texto, medalha ou o quadro de data/assinatura.

Resolução: `npm run kits:check` mostra o DPI efetivo de impressão. As artes entregues em out/2026 têm ~300–750 px
de largura (46–123 DPI no papel). Para impressão nítida, substitua pelos originais em alta (ideal 300 DPI:
introdução/certificado ~2250x3000 px, pistas ~1050x1550 px) mantendo os mesmos nomes de arquivo — nada no código muda.

Tamanho: o deploy serverless da Vercel tem limite de ~250 MB por função. Use 150–200 DPI (pistas ~1200×1700 px)
e PNG otimizado ou JPEG de qualidade 90. 60 arquivos de 1–2 MB cabem com folga.

## Composição editorial (os 6 temas)

O PDF desenha em vetor o cenário, o papel, as placas, os selos, a medalha e toda a tipografia; as artes entram só como
ilustrações recortadas, **nunca maiores que 150 DPI efetivos** no papel.

- `src/lib/editorial/<tema>.ts`: textos revisados de cada tema, recortes das ilustrações e onde esconder cada pista.
- Dinossauros: `src/lib/pdf/editorial/jurassic.ts` (direção aprovada, não alterar).
- Espaço, Futebol, Princesas, Fadas, Sereias: motor `storybook.ts` + identidade de cada tema em `styles.ts`.
- Guia do responsável: `src/lib/pdf/guide.ts` (rota `/api/guia/<token>`).

`npm run kits:check` gera os 6 PDFs e mede cada ilustração no tamanho impresso (erro abaixo de 120 DPI).
`npm run pdf:sample -- <tema> "Nome"` e `npx tsx scripts/sample-guide.ts <tema> "Nome"` geram amostras em `output/`.
