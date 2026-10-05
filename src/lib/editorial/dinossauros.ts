/**
 * Dinossauros — textos transcritos das artes originais (out/2026), sem alteração de conteúdo.
 * Única correção: "seem limpinhas" → "saem limpinhas" (erro de digitação na arte da pista 2).
 * Recortes: maior área de ilustração SEM texto rasterizado de cada arte (conferidos visualmente).
 */
import type { EditorialKit } from "./types";

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

export const dinossauros: EditorialKit = {
  icon: "footprint",
  palette: {
    page: rgb("#fbf3dc"),
    parchment: rgb("#f8e9c4"),
    parchmentEdge: rgb("#d9b77a"),
    wood: rgb("#7a4622"),
    woodDark: rgb("#4a2a12"),
    woodText: rgb("#fff3d6"),
    ink: rgb("#3a2414"),
    accent: rgb("#e47d1e"),
    accentDark: rgb("#8a3f0c"),
    alert: rgb("#a3221b"),
    leaf: rgb("#4f8f3a"),
    leafDark: rgb("#2f5f25"),
    badge: rgb("#f3cf8a"),
    badgeEdge: rgb("#b9822f"),
    icon: rgb("#3a2a1e"),
    gold: rgb("#e3a630"),
  },
  intro: {
    titleLines: ["A EXPEDIÇÃO", "DO OVO PERDIDO"],
    headline: "UMA GRANDE DESCOBERTA ESTÁ PRESTES A COMEÇAR!",
    paragraphs: [
      "Pegadas misteriosas foram encontradas e precisamos da sua ajuda para resolver esse mistério!",
      "Siga as pistas, complete os desafios e descubra onde está o ovo perdido.",
      "Uma aventura incrível espera por você!",
      "Vamos nessa, explorador?",
    ],
    cast: [
      { file: "certificado", x: 52, y: 4, w: 150, h: 150 },
      { file: "pista-06", x: 18, y: 178, w: 150, h: 150 },
      { file: "pista-07", x: 150, y: 178, w: 150, h: 150 },
      { file: "pista-04", x: 96, y: 206, w: 118, h: 118 },
      { file: "pista-08", x: 282, y: 184, w: 148, h: 148 },
    ],
  },
  clues: [
    {
      title: "Encontramos as primeiras pegadas!",
      body: "Um dinossauro faminto passou por aqui. A próxima pista está no lugar onde os alimentos ficam bem fresquinhos.",
      art: { file: "pista-01", x: 0, y: 236, w: 305, h: 172 },
    },
    {
      title: "Cuidado, exploradores!",
      body: "As pegadas estão cobertas de lama. Procure o lugar onde as roupas entram sujas e saem limpinhas.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Caminhem juntos por 5 passos como um T-Rex!" },
      art: { file: "pista-02", x: 0, y: 196, w: 295, h: 110 },
    },
    {
      title: "O caminho ficou silencioso...",
      body: "Parece que o dinossauro resolveu descansar. A próxima pista está no lugar onde você dorme e recupera suas energias.",
      art: { file: "pista-03", x: 0, y: 248, w: 282, h: 162 },
    },
    {
      title: "O ovo está cada vez mais perto!",
      body: "Um enorme dinossauro passou pelo lugar onde a família costuma sentar para descansar.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Inventem juntos o rugido secreto da equipe!" },
      art: { file: "pista-04", x: 0, y: 204, w: 290, h: 124 },
    },
    {
      title: "Encontramos uma pista estranha...",
      body: "Para continuar, procure um lugar onde você consegue ver um explorador exatamente igual a você.",
      art: { file: "pista-05", x: 0, y: 208, w: 365, h: 128 },
    },
    {
      title: "Pegadas de dinossauro!",
      body: "Agora procure onde ficam guardados os pares que você coloca nos pés para sair de casa.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Comparem suas pegadas e descubram quem tem o maior pé!" },
      art: { file: "pista-06", x: 0, y: 176, w: 172, h: 160 },
    },
    {
      title: "Estamos quase chegando ao ninho!",
      body: "A próxima pista está onde vocês se sentam para fazer as refeições.",
      art: { file: "pista-07", x: 0, y: 178, w: 364, h: 158 },
    },
    {
      title: "VOCÊ ENCONTROU O OVO PERDIDO!",
      titleStyle: "final",
      body: "A expedição foi um sucesso.",
      challenge: {
        label: "DESAFIO FINAL",
        text: "Façam juntos a Dança dos Dinossauros por 10 segundos. Depois, procurem o Guardião da Missão. Ele tem uma surpresa esperando por vocês!",
      },
      art: { file: "pista-08", x: 268, y: 0, w: 166, h: 336 },
    },
  ],
  certificate: {
    title: "CERTIFICADO",
    subtitle: "EXPLORADOR DE DINOSSAUROS",
    text: "Você concluiu a expedição do Ovo Perdido e se tornou um verdadeiro explorador!",
    dateLabel: "Data da Expedição:",
    signatureLabel: "Assinatura do Guardião da Missão:",
    art: [
      { file: "certificado", x: 24, y: 4, w: 172, h: 172 },
      { file: "pista-08", x: 282, y: 184, w: 148, h: 148 },
    ],
  },
};
