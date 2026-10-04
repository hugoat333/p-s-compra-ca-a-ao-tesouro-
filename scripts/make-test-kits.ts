/** Gera kits sintéticos para o teste E2E. Uso: tsx scripts/make-test-kits.ts <pasta> */
import { writeFixtureKits } from "../tests/fixtures/kits";

const dir = process.argv[2];
if (!dir || dir.includes("kits/") || dir === "kits") throw new Error("Informe uma pasta temporária (nunca ./kits).");
writeFixtureKits(dir).then(() => console.log(`kits de teste em ${dir}`));
