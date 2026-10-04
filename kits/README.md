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

Posição do nome: ajuste `LAYOUT_OVERRIDES` em `src/lib/kits/manifest.ts` (coordenadas relativas 0–1 da arte).

Tamanho: o deploy serverless da Vercel tem limite de ~250 MB por função. Use 150–200 DPI (pistas ~1200×1700 px)
e PNG otimizado ou JPEG de qualidade 90. 60 arquivos de 1–2 MB cabem com folga.
