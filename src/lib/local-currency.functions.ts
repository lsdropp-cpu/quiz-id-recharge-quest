import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getLocalQuote = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ key: z.enum(["9", "15", "19", "25", "29", "35"]), country: z.string().regex(/^[A-Z]{2}$/).optional(), timezoneCountry: z.string().regex(/^[A-Z]{2}$/).optional() }).parse(data))
  .handler(async ({ data }) => {
    const secret = process.env["STRIPE_SECRET_KEY"];
    if (!secret) return { quote: null, error: "No se pudo obtener el precio. Intenta de nuevo." };
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const { resolveCheckoutCountry } = await import("./local-currency");
      const country = resolveCheckoutCountry(data.country, (getRequestHeader("cf-ipcountry") || "").toUpperCase(), data.timezoneCountry);
      const { createLocalQuote } = await import("./local-currency.server");
      return { quote: await createLocalQuote(data.key, country, secret), error: null };
    } catch {
      return { quote: null, error: "No se pudo obtener el precio. Intenta de nuevo." };
    }
  });
