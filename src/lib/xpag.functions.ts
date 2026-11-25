import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  createChargeInputSchema,
  type LocalCheckoutOptions,
  type XpagChargeInstruction,
} from "./xpag";

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
        error: err instanceof Error ? err.message : "Não foi possível carregar as cotações.",
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
        error: err instanceof Error ? err.message : "Não foi possível gerar o pagamento.",
      };
    }
  });

export const checkLocalXpagStatus = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        requestNumber: z.string().trim().min(1).max(128),
        method: z.enum(["OXXO", "SPEI", "NEQUI", "BREB", "PIX"]),
        currency: z.enum(["MXN", "COP", "BRL"]),
        amount: z.number().positive(),
        externalId: z.string().trim().min(1).max(128),
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
        error: err instanceof Error ? err.message : "Não foi possível consultar o status.",
      };
    }
  });