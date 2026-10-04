import { loadConfig } from "./config";
import { getOrderRepository } from "../db";
import { getEmailService } from "../mail/service";
import { generateAdventurePdf } from "../pdf/generate";
import type { DeliveryDeps } from "./delivery";

export function getDeliveryDeps(): DeliveryDeps & { kitsDir: string; fontsDir: string } {
  const cfg = loadConfig();
  return {
    repo: getOrderRepository(),
    email: getEmailService(cfg.email),
    appUrl: cfg.appUrl,
    productId: cfg.checkoutProductId,
    kitsDir: cfg.kitsDir,
    fontsDir: cfg.fontsDir,
    generatePdf: async ({ theme, childName }) =>
      (await generateAdventurePdf({ theme, childName, kitsDir: cfg.kitsDir, fontsDir: cfg.fontsDir })).bytes,
  };
}
