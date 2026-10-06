import type { ThemeId } from "../themes";
import type { EditorialKit } from "./types";
import { dinossauros } from "./dinossauros";
import { espaco } from "./espaco";
import { futebol } from "./futebol";
import { princesas } from "./princesas";
import { fadas } from "./fadas";
import { sereias } from "./sereias";

/** Conteúdo editorial dos 6 temas (textos revisados, recortes e locais de esconderijo). */
const KITS: Record<ThemeId, EditorialKit> = { dinossauros, espaco, futebol, princesas, fadas, sereias };

export function editorialKit(theme: ThemeId): EditorialKit {
  return KITS[theme];
}

export type { EditorialKit } from "./types";
