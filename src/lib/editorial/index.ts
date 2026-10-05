import type { ThemeId } from "../themes";
import type { EditorialKit } from "./types";
import { dinossauros } from "./dinossauros";

/** Temas já migrados para a composição editorial (vetor-first). Os demais usam o layout legado. */
const KITS: Partial<Record<ThemeId, EditorialKit>> = { dinossauros };

export function editorialKit(theme: ThemeId): EditorialKit | undefined {
  return KITS[theme];
}

export type { EditorialKit } from "./types";
