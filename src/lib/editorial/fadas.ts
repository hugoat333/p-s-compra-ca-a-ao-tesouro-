/** Fadas — textos transcritos das artes originais, revisados ("Batam as mãos"). */
import type { EditorialKit } from "./types";
import { HIDE_SPOTS as H } from "./hideSpots";
import { hex } from "./colors";

export const fadas: EditorialKit = {
  missionName: "O Resgate do Pó Mágico",
  treasure: "o Pó Mágico",
  icon: "footprint",
  palette: {
    page: hex("#f7f3ff"),
    parchment: hex("#fdf8ea"),
    parchmentEdge: hex("#cdb98a"),
    wood: hex("#8a5a2b"),
    woodDark: hex("#4d3015"),
    woodText: hex("#fff6e0"),
    ink: hex("#2f2140"),
    accent: hex("#d6338a"),
    accentDark: hex("#7a1550"),
    alert: hex("#c2185b"),
    leaf: hex("#5fae4b"),
    leafDark: hex("#2f6b2a"),
    badge: hex("#ffe7f3"),
    badgeEdge: hex("#d6338a"),
    icon: hex("#d6338a"),
    gold: hex("#f2c14e"),
  },
  intro: {
    titleLines: ["O RESGATE DO", "PÓ MÁGICO"],
    headline: "UMA AVENTURA MÁGICA ESTÁ PRESTES A COMEÇAR!",
    paragraphs: [
      "O Pó Mágico das fadas desapareceu e precisamos da sua ajuda para encontrá-lo!",
      "Siga as pistas, complete os desafios e devolva a magia ao reino das fadas!",
      "VAMOS NESSA?",
    ],
    cast: [
      { file: "introducao", x: 100, y: 175, w: 150, h: 150 },
      { file: "introducao", x: 235, y: 235, w: 95, h: 95 },
      { file: "pista-07", x: 110, y: 250, w: 140, h: 140 },
      { file: "pista-03", x: 60, y: 300, w: 140, h: 140 },
      { file: "pista-08", x: 215, y: 375, w: 87, h: 100 },
    ],
  },
  clues: [
    {
      title: "Oh, não! O Pó Mágico sumiu!",
      hideAt: H[0],
      body: "Encontramos pequenos brilhos por aqui. A próxima pista está no lugar onde os alimentos ficam bem fresquinhos.",
      art: { file: "pista-01", x: 0, y: 265, w: 290, h: 172 },
    },
    {
      title: "Encontramos mais pó de fada!",
      hideAt: H[1],
      body: "Agora procure o lugar onde as roupas são lavadas e ficam limpinhas novamente.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Batam as mãos 3 vezes e inventem juntos uma palavra mágica!" },
      art: { file: "pista-02", x: 0, y: 295, w: 282, h: 165 },
    },
    {
      title: "Uma fada cansada precisa descansar suas asas.",
      hideAt: H[2],
      body: "A próxima pista está no lugar onde você dorme e sonha.",
      art: { file: "pista-03", x: 0, y: 285, w: 278, h: 172 },
    },
    {
      title: "As asas voltaram a brilhar!",
      hideAt: H[3],
      body: "A próxima pista está em um lugar macio onde a família costuma sentar.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Finjam que ganharam asas e voem juntos por 5 segundos!" },
      art: { file: "pista-04", x: 0, y: 290, w: 273, h: 165 },
    },
    {
      title: "Existe um objeto mágico que mostra seu rosto sem usar nenhuma palavra.",
      hideAt: H[4],
      body: "Encontre-o para descobrir a próxima pista.",
      art: { file: "pista-05", x: 0, y: 240, w: 318, h: 175 },
    },
    {
      title: "Para caminhar pelo mundo dos humanos, até as fadas precisam proteger os pés.",
      hideAt: H[5],
      body: "Procure onde ficam seus sapatos ou tênis.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Encostem as mãos e façam um desejo secreto juntos!" },
      art: { file: "pista-06", x: 110, y: 290, w: 192, h: 165 },
    },
    {
      title: "O Pó Mágico está muito perto!",
      hideAt: H[6],
      body: "A próxima pista está onde a família costuma se reunir para fazer as refeições.",
      art: { file: "pista-07", x: 0, y: 240, w: 304, h: 172 },
    },
    {
      title: "O PÓ MÁGICO FOI RECUPERADO!",
      hideAt: H[7],
      titleStyle: "final",
      body: "O reino das fadas está salvo!",
      challenge: {
        label: "DESAFIO FINAL",
        text: "Façam juntos uma chuva de pó mágico imaginário e procurem o Guardião da Missão. Ele guarda uma surpresa encantada!",
      },
      art: { file: "pista-08", x: 30, y: 290, w: 190, h: 215 },
    },
  ],
  certificate: {
    title: "CERTIFICADO",
    subtitle: "GUARDIÃ DA MAGIA",
    text: "Você concluiu o Resgate do Pó Mágico e se tornou uma verdadeira guardiã das fadas!",
    dateLabel: "Data da Missão:",
    signatureLabel: "Assinatura do Guardião da Missão:",
    art: [
      { file: "introducao", x: 100, y: 175, w: 150, h: 150 },
      { file: "introducao", x: 235, y: 235, w: 95, h: 95 },
    ],
  },
};
