import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { THEME_IDS, type ThemeId } from "@/lib/themes";
import PersonalizarClient from "./PersonalizarClient";

export const metadata: Metadata = {
  title: "Prepare sua aventura — O Tesouro do Dia das Crianças",
  robots: { index: false, follow: false },
};

function availableThumbs(): Record<ThemeId, boolean> {
  const dir = path.join(process.cwd(), "public", "temas");
  return Object.fromEntries(THEME_IDS.map((id) => [id, fs.existsSync(path.join(dir, `${id}.webp`))])) as Record<
    ThemeId,
    boolean
  >;
}

export default function PersonalizarPage() {
  return <PersonalizarClient thumbs={availableThumbs()} />;
}
