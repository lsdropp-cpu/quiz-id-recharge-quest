import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { RechargeKey } from "./recharge-packages";
import {
  createChargeInputSchema,
  type LocalCheckoutOptions,
  type XpagChargeInstruction,
} from "./xpag";

export const getColombiaRechargePrices = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ prices: Record<RechargeKey, number> | null; error: string | null }> => {
    try {
      const { fetchLocalRates } = await import("./xpag.server");
      const { rechargePackages } = await import("./recharge-packages");
      const { roundForCurrency } = await import("./xpag");
      const { rates } = await fetchLocalRates();
      const prices = {} as Record<RechargeKey, number>;
      for (const pack of rechargePackages) {
        prices[pack.key] = roundForCurrency(pack.priceUsd, rates.COP, "COP");
      }
      return { prices, error: null };
    } catch (err) {
      return {
        prices: null,
        error: err instanceof Error ? err.message : "No se pudieron cargar los precios en pesos colombianos.",
      };
    }
  },
);

export const getLocalCheckoutOptions = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ priceKey: z.enum(["9", "15", "19", "25", "29", "35"]) }).parse(data),
  )
  .handler(async ({ data }): Promise<{ options: LocalCheckoutOptions | null; error: string | null }> => {
    try {
      const { getLocalCheckoutOptionsServer } = await import("./xpag.server");
      return { options: await getLocalCheckoutOptionsServer(data.priceKey), error: null };
    } catch (err) {
      return {
        options: null,
        error: err instanceof Error ? err.message : "No se pudieron cargar las cotizaciones.",
      };
    }
  });

export const createLocalXpagCharge = createServerFn({ method: "POST" })
  .inputValidator((data) => createChargeInputSchema.parse(data))
  .handler(async ({ data }): Promise<{ charge: XpagChargeInstruction | null; error: string | null }> => {
    try {
      const { createXpagChargeServer } = await import("./xpag.server");
      return { charge: await createXpagChargeServer(data), error: null };
    } catch (err) {
      return {
        charge: null,
        error: err instanceof Error ? err.message : "No se pudo generar el pago.",
      };
    }
  });

export const checkLocalXpagStatus = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        statusToken: z.string().min(1).max(4096),
      })
      .parse(data),
  )
  .handler(async ({ data }): Promise<{ charge: XpagChargeInstruction | null; error: string | null }> => {
    try {
      const { consultXpagChargeServer } = await import("./xpag.server");
      return { charge: await consultXpagChargeServer(data), error: null };
    } catch (err) {
      return {
        charge: null,
        error: err instanceof Error ? err.message : "No se pudo consultar el estado del pago.",
      };
    }
  });