/**
 * Sereias — textos transcritos das artes originais, revisados.
 * Coerência: o desafio da pista 6 terminava com "DECOLAR!" (copiado do tema Espaço); trocado por "MERGULHAR!".
 */
import type { EditorialKit } from "./types";
import { HIDE_SPOTS as H } from "./hideSpots";
import { hex } from "./colors";

export const sereias: EditorialKit = {
  missionName: "O Tesouro das Sereias",
  treasure: "o Tesouro das Sereias",
  icon: "footprint",
  palette: {
    page: hex("#effaff"),
    parchment: hex("#fdf6e6"),
    parchmentEdge: hex("#d9c08f"),
    wood: hex("#8a5a2b"),
    woodDark: hex("#4d3015"),
    woodText: hex("#fff6e0"),
    ink: hex("#123b52"),
    accent: hex("#e0337f"),
    accentDark: hex("#86154a"),
    alert: hex("#c2185b"),
    leaf: hex("#22a39a"),
    leafDark: hex("#11665f"),
    badge: hex("#ffe1ec"),
    badgeEdge: hex("#e0337f"),
    icon: hex("#e0337f"),
    gold: hex("#f2c14e"),
  },
  intro: {
    titleLines: ["O TESOURO", "DAS SEREIAS"],
    headline: "UMA AVENTURA NO FUNDO DO MAR ESTÁ PRESTES A COMEÇAR!",
    paragraphs: [
      "O Tesouro das Sereias desapareceu e precisamos da sua ajuda para encontrá-lo!",
      "Siga as pistas, complete os desafios e descubra onde está o tesouro!",
      "VAMOS NESSA?",
    ],
    cast: [
      { file: "introducao", x: 120, y: 160, w: 150, h: 150 },
      { file: "introducao", x: 265, y: 135, w: 110, h: 110 },
      { file: "pista-03", x: 125, y: 370, w: 110, h: 110 },
      { file: "pista-07", x: 0, y: 375, w: 120, h: 120 },
      { file: "pista-08", x: 170, y: 290, w: 120, h: 120 },
    ],
  },
  clues: [
    {
      title: "A aventura começou!",
      hideAt: H[0],
      body: "Encontramos uma concha brilhante no caminho. A próxima pista está no lugar onde os alimentos ficam bem fresquinhos.",
      art: { file: "pista-01", x: 0, y: 245, w: 289, h: 172 },
    },
    {
      title: "Mais um tesouro encontrado!",
      hideAt: H[1],
      body: "Agora procure o lugar onde as roupas são lavadas e ficam limpinhas novamente.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam 5 bolhas gigantes juntos como verdadeiras sereias!" },
      art: { file: "pista-02", x: 0, y: 300, w: 282, h: 165 },
    },
    {
      title: "As sereias também precisam descansar!",
      hideAt: H[2],
      body: "A próxima pista está no lugar onde você dorme e sonha com novas aventuras.",
      art: { file: "pista-03", x: 0, y: 285, w: 280, h: 172 },
    },
    {
      title: "Estamos cada vez mais perto!",
      hideAt: H[3],
      body: "A próxima pista está no lugar onde a família costuma sentar para descansar.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Inventem uma dança das sereias juntos e dancem por 5 segundos!" },
      art: { file: "pista-04", x: 0, y: 305, w: 272, h: 165 },
    },
    {
      title: "Existe um objeto brilhante que mostra seu reflexo como as águas do mar!",
      hideAt: H[4],
      body: "Procure o lugar onde você consegue se ver exatamente como é.",
      art: { file: "pista-05", x: 0, y: 240, w: 318, h: 175 },
    },
    {
      title: "Para continuar essa aventura, cuide bem dos seus pés de sereia!",
      hideAt: H[5],
      body: "A próxima pista está onde você coloca seus sapatos ou tênis.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam uma contagem regressiva juntos: 5, 4, 3, 2, 1... MERGULHAR!" },
      art: { file: "pista-06", x: 100, y: 310, w: 195, h: 165 },
    },
    {
      title: "Estamos quase lá!",
      hideAt: H[6],
      body: "A próxima pista está no lugar onde a família se reúne para fazer suas refeições.",
      art: { file: "pista-07", x: 0, y: 215, w: 310, h: 175 },
    },
    {
      title: "O TESOURO DAS SEREIAS FOI ENCONTRADO!",
      hideAt: H[7],
      titleStyle: "final",
      body: "O reino está salvo!",
      challenge: {
        label: "DESAFIO FINAL",
        text: "Façam juntos uma pose de sereia e procurem o Guardião da Missão. Ele tem uma surpresa especial esperando por vocês!",
      },
      art: { file: "pista-08", x: 110, y: 280, w: 190, h: 220 },
    },
  ],
  certificate: {
    title: "CERTIFICADO",
    subtitle: "GUARDIÃO DO TESOURO DAS SEREIAS",
    text: "Você concluiu o Tesouro das Sereias e se tornou um verdadeiro guardião do reino!",
    dateLabel: "Data da Missão:",
    signatureLabel: "Assinatura do Guardião da Missão:",
    art: [
      { file: "introducao", x: 120, y: 160, w: 150, h: 150 },
      { file: "introducao", x: 265, y: 135, w: 110, h: 110 },
    ],
  },
};
