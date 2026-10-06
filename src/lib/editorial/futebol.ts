/** Futebol — textos transcritos das artes originais, revisados ("difícil", "espírito"). */
import type { EditorialKit } from "./types";
import { HIDE_SPOTS as H } from "./hideSpots";
import { hex } from "./colors";

export const futebol: EditorialKit = {
  missionName: "A Missão do Troféu Dourado",
  treasure: "o Troféu Dourado",
  icon: "footprint",
  palette: {
    page: hex("#f6fbef"),
    parchment: hex("#fffdf3"),
    parchmentEdge: hex("#b9c98f"),
    wood: hex("#1d6b34"),
    woodDark: hex("#0f3d1c"),
    woodText: hex("#ffffff"),
    ink: hex("#16301d"),
    accent: hex("#f2b705"),
    accentDark: hex("#8a6000"),
    alert: hex("#c81e1e"),
    leaf: hex("#3fae5b"),
    leafDark: hex("#1d6b34"),
    badge: hex("#ffffff"),
    badgeEdge: hex("#1d6b34"),
    icon: hex("#1f2937"),
    gold: hex("#f2b705"),
  },
  intro: {
    titleLines: ["A MISSÃO DO", "TROFÉU DOURADO"],
    headline: "UMA GRANDE AVENTURA ESTÁ PRESTES A COMEÇAR!",
    paragraphs: [
      "O Troféu Dourado desapareceu e precisamos da sua ajuda para encontrá-lo!",
      "Siga as pistas, complete os desafios e mostre que você tem um verdadeiro espírito de campeão!",
      "VAMOS JOGAR?",
    ],
    cast: [
      { file: "introducao", x: 95, y: 135, w: 150, h: 150 },
      { file: "pista-04", x: 75, y: 300, w: 140, h: 140 },
      { file: "pista-03", x: 40, y: 320, w: 140, h: 140 },
      { file: "pista-06", x: 0, y: 330, w: 130, h: 130 },
      { file: "pista-01", x: 30, y: 300, w: 140, h: 140 },
    ],
  },
  clues: [
    {
      title: "O jogo começou!",
      hideAt: H[0],
      body: "Para encontrar o Troféu Dourado, precisamos seguir as pistas. A próxima está no lugar onde os alimentos ficam bem geladinhos antes da partida.",
      art: { file: "pista-01", x: 0, y: 300, w: 275, h: 172 },
    },
    {
      title: "Depois de um jogo difícil, o uniforme precisa ficar limpo outra vez.",
      hideAt: H[1],
      body: "Procure onde as roupas são lavadas.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam 5 passes imaginários sem deixar a bola cair!" },
      art: { file: "pista-02", x: 0, y: 305, w: 262, h: 160 },
    },
    {
      title: "Todo grande jogador precisa descansar antes da próxima partida.",
      hideAt: H[2],
      body: "A próxima pista está no lugar onde você dorme e recupera suas energias.",
      art: { file: "pista-03", x: 0, y: 300, w: 299, h: 172 },
    },
    {
      title: "GOOOL!",
      hideAt: H[3],
      body: "Estamos no caminho certo. Agora procure o lugar macio onde a torcida da casa costuma sentar.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Inventem juntos uma comemoração de gol exclusiva da equipe!" },
      art: { file: "pista-04", x: 0, y: 305, w: 293, h: 165 },
    },
    {
      title: "Para ser campeão é preciso encarar um adversário muito especial.",
      hideAt: H[4],
      body: "Procure o lugar onde você consegue olhar diretamente para ele... e ele faz exatamente tudo o que você faz!",
      art: { file: "pista-05", x: 0, y: 250, w: 319, h: 175 },
    },
    {
      title: "Nenhum jogador entra em campo sem cuidar dos seus pés.",
      hideAt: H[5],
      body: "Procure onde ficam seus sapatos ou tênis.",
      challenge: { label: "DESAFIO EM DUPLA", text: "Façam uma cobrança de pênalti imaginária e comemorem o gol juntos!" },
      art: { file: "pista-06", x: 0, y: 320, w: 180, h: 165 },
    },
    {
      title: "O apito final está chegando!",
      hideAt: H[6],
      body: "A próxima pista está no lugar onde vocês costumam se sentar para fazer as refeições.",
      art: { file: "pista-07", x: 0, y: 240, w: 280, h: 172 },
    },
    {
      title: "CAMPEÕES!",
      hideAt: H[7],
      titleStyle: "final",
      body: "Vocês chegaram ao final e conquistaram o Troféu Dourado!",
      challenge: {
        label: "DESAFIO FINAL",
        text: "Façam a comemoração oficial da equipe e procurem o Guardião da Missão. O prêmio dos campeões está esperando!",
      },
      art: { file: "pista-08", x: 10, y: 290, w: 190, h: 215 },
    },
  ],
  certificate: {
    title: "CERTIFICADO",
    subtitle: "CAMPEÃO DO TROFÉU DOURADO",
    text: "Você concluiu a Missão do Troféu Dourado e se tornou um verdadeiro campeão!",
    dateLabel: "Data da Missão:",
    signatureLabel: "Assinatura do Guardião da Missão:",
    art: [
      { file: "introducao", x: 95, y: 135, w: 150, h: 150 },
      { file: "pista-08", x: 150, y: 330, w: 146, h: 146 },
    ],
  },
};
