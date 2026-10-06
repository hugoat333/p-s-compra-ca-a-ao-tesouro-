/** Princesas — textos transcritos das artes originais, revisados. */
import type { EditorialKit } from "./types";
import { HIDE_SPOTS as H } from "./hideSpots";
import { hex } from "./colors";

export const princesas: EditorialKit = {
  missionName: "O Mistério da Coroa Encantada",
  treasure: "a Coroa Encantada",
  icon: "footprint",
  palette: {
    page: hex("#fff5f8"),
    parchment: hex("#fff6ef"),
    parchmentEdge: hex("#e7b7c4"),
    wood: hex("#c2185b"),
    woodDark: hex("#7a0f3a"),
    woodText: hex("#ffffff"),
    ink: hex("#4a1630"),
    accent: hex("#d81b60"),
    accentDark: hex("#7a0f3a"),
    alert: hex("#b0124d"),
    leaf: hex("#6fae5b"),
    leafDark: hex("#3d7a35"),
    badge: hex("#ffe08a"),
    badgeEdge: hex("#c8921a"),
    icon: hex("#c2185b"),
    gold: hex("#e8b23a"),
  },
  intro: {
    titleLines: ["O MISTÉRIO DA", "COROA ENCANTADA"],
    headline: "UMA AVENTURA REAL ESTÁ PRESTES A COMEÇAR!",
    paragraphs: [
      "A Coroa Encantada desapareceu do castelo e precisamos da sua ajuda para encontrá-la!",
      "Siga as pistas, complete os desafios e descubra onde está a coroa!",
      "VAMOS NESSA, PRINCESA?",
    ],
    cast: [
      { file: "introducao", x: 60, y: 150, w: 150, h: 150 },
      { file: "introducao", x: 205, y: 235, w: 105, h: 105 },
      { file: "pista-04", x: 70, y: 300, w: 150, h: 150 },
      { file: "pista-03", x: 30, y: 315, w: 140, h: 140 },
      { file: "pista-08", x: 180, y: 275, w: 110, h: 110 },
    ],
  },
  clues: [
    {
      title: "A Coroa Encantada deixou um brilho por aqui!",
      hideAt: H[0],
      body: "A próxima pista está no lugar onde os alimentos ficam bem fresquinhos.",
      art: { file: "pista-01", x: 0, y: 245, w: 285, h: 172 },
    },
    {
      title: "Encontramos mais um brilho mágico!",
      hideAt: H[1],
      body: "Agora procure o lugar onde as roupas ficam limpinhas novamente.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Inventem um cumprimento secreto da Família Real!" },
      art: { file: "pista-02", x: 0, y: 300, w: 285, h: 165 },
    },
    {
      title: "A magia da coroa passou pelo quarto real.",
      hideAt: H[2],
      body: "A próxima pista está no lugar onde você descansa e tem seus sonhos.",
      art: { file: "pista-03", x: 0, y: 295, w: 281, h: 172 },
    },
    {
      title: "O encanto está ficando mais forte!",
      hideAt: H[3],
      body: "A próxima pista está no lugar macio onde a família costuma sentar e descansar.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam juntos uma pose real digna de um retrato do castelo!" },
      art: { file: "pista-04", x: 0, y: 300, w: 275, h: 165 },
    },
    {
      title: "Existe um objeto mágico que mostra exatamente quem está diante dele.",
      hideAt: H[4],
      body: "Encontre-o para descobrir a próxima pista.",
      art: { file: "pista-05", x: 0, y: 230, w: 319, h: 175 },
    },
    {
      title: "Para continuar pelo reino,",
      hideAt: H[5],
      body: "precisamos encontrar onde ficam os pares que você coloca nos pés.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Deem juntos 3 passos reais e façam uma reverência no final!" },
      art: { file: "pista-06", x: 100, y: 285, w: 188, h: 165 },
    },
    {
      title: "Estamos chegando ao grande salão!",
      hideAt: H[6],
      body: "A próxima pista está no lugar onde a família costuma se reunir para fazer suas refeições.",
      art: { file: "pista-07", x: 0, y: 250, w: 293, h: 172 },
    },
    {
      title: "A COROA ENCANTADA FOI RECUPERADA!",
      hideAt: H[7],
      titleStyle: "final",
      body: "O reino está salvo!",
      challenge: {
        label: "DESAFIO FINAL",
        text: "Criem juntos a comemoração oficial do reino e procurem o Guardião da Missão. Ele protege uma surpresa real!",
      },
      art: { file: "pista-08", x: 100, y: 275, w: 190, h: 225 },
    },
  ],
  certificate: {
    title: "CERTIFICADO",
    subtitle: "PRINCESA REAL",
    text: "Você concluiu O Mistério da Coroa Encantada e se tornou uma verdadeira princesa!",
    dateLabel: "Data da Missão:",
    signatureLabel: "Assinatura do Guardião da Missão:",
    art: [
      { file: "introducao", x: 60, y: 150, w: 150, h: 150 },
      { file: "introducao", x: 205, y: 235, w: 105, h: 105 },
    ],
  },
};
