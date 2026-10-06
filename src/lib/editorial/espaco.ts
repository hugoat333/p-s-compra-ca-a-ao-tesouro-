/** Espaço — textos transcritos das artes originais, revisados. Recortes sem texto rasterizado. */
import type { EditorialKit } from "./types";
import { HIDE_SPOTS as H } from "./hideSpots";
import { hex } from "./colors";

export const espaco: EditorialKit = {
  missionName: "Missão do Cristal Lunar",
  treasure: "o Cristal Lunar",
  icon: "footprint",
  palette: {
    page: hex("#eef1ff"),
    parchment: hex("#f3f5ff"),
    parchmentEdge: hex("#9aa6e0"),
    wood: hex("#22307a"),
    woodDark: hex("#121a4a"),
    woodText: hex("#ffffff"),
    ink: hex("#1b2250"),
    accent: hex("#f2a516"),
    accentDark: hex("#9a5a06"),
    alert: hex("#c2410c"),
    leaf: hex("#7c5cff"),
    leafDark: hex("#3b2a99"),
    badge: hex("#ffd56b"),
    badgeEdge: hex("#c58a10"),
    icon: hex("#22307a"),
    gold: hex("#f5b82e"),
  },
  intro: {
    titleLines: ["MISSÃO DO", "CRISTAL LUNAR"],
    headline: "UMA MISSÃO MUITO IMPORTANTE ESTÁ PRESTES A COMEÇAR!",
    paragraphs: [
      "O Cristal Lunar foi perdido durante uma viagem pela galáxia e precisamos da sua ajuda para encontrá-lo.",
      "Siga as pistas, complete os desafios e mostre que você tem tudo o que um grande astronauta precisa:",
      "PRONTOS PARA DECOLAR?",
    ],
    cast: [
      { file: "introducao", x: 100, y: 140, w: 150, h: 150 },
      { file: "pista-02", x: 150, y: 225, w: 110, h: 110 },
      { file: "pista-08", x: 40, y: 300, w: 150, h: 150 },
      { file: "introducao", x: 5, y: 315, w: 105, h: 105 },
      { file: "certificado", x: 95, y: 235, w: 125, h: 125 },
    ],
  },
  clues: [
    {
      title: "A missão começou!",
      hideAt: H[0],
      body: "O Cristal Lunar deixou um sinal. A próxima coordenada está na estação onde os alimentos ficam bem geladinhos.",
      art: { file: "pista-01", x: 0, y: 300, w: 285, h: 172 },
    },
    {
      title: "Detectamos poeira espacial!",
      hideAt: H[1],
      body: "Procure o lugar onde as roupas entram sujas e saem limpas.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam juntos 5 passos em câmera lenta como astronautas na Lua." },
      art: { file: "pista-02", x: 0, y: 250, w: 279, h: 148 },
    },
    {
      title: "A tripulação precisa recarregar as energias.",
      hideAt: H[2],
      body: "Sua próxima coordenada está no lugar onde você dorme todas as noites.",
      art: { file: "pista-03", x: 0, y: 305, w: 286, h: 172 },
    },
    {
      title: "Sinal detectado!",
      hideAt: H[3],
      body: "O Cristal passou pela estação onde a tripulação costuma sentar e descansar.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Criem um nome secreto para a equipe espacial de vocês!" },
      art: { file: "pista-04", x: 0, y: 315, w: 276, h: 165 },
    },
    {
      title: "O computador da nave encontrou um novo sinal.",
      hideAt: H[4],
      body: "Procure um lugar onde você consegue ver o rosto do astronauta responsável por esta missão.",
      art: { file: "pista-05", x: 0, y: 270, w: 306, h: 175 },
    },
    {
      title: "Prepare-se para explorar um novo planeta!",
      hideAt: H[5],
      body: "A próxima pista está onde ficam os pares que protegem seus pés.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam a contagem regressiva juntos: 5, 4, 3, 2, 1... DECOLAR!" },
      art: { file: "pista-06", x: 0, y: 340, w: 180, h: 160 },
    },
    {
      title: "Estamos chegando às coordenadas finais.",
      hideAt: H[6],
      body: "Procure o lugar onde a tripulação se reúne para fazer suas refeições.",
      art: { file: "pista-07", x: 0, y: 262, w: 290, h: 165 },
    },
    {
      title: "CRISTAL LUNAR RECUPERADO!",
      hideAt: H[7],
      titleStyle: "final",
      body: "A missão espacial foi concluída.",
      challenge: {
        label: "DESAFIO FINAL",
        text: "Deem 5 pulos lunares juntos e procurem o Guardião da Missão. Ele recebeu uma entrega especial diretamente do espaço!",
      },
      art: { file: "pista-08", x: 30, y: 300, w: 170, h: 205 },
    },
  ],
  certificate: {
    title: "CERTIFICADO",
    subtitle: "ASTRONAUTA OFICIAL",
    text: "Você concluiu a Missão do Cristal Lunar e se tornou um verdadeiro astronauta!",
    dateLabel: "Data da Missão:",
    signatureLabel: "Assinatura do Guardião da Missão:",
    art: [
      { file: "introducao", x: 100, y: 140, w: 150, h: 150 },
      { file: "pista-02", x: 150, y: 225, w: 110, h: 110 },
    ],
  },
};
