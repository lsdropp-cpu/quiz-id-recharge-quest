import { test } from "node:test";
import { strictEqual } from "node:assert/strict";
import {
  createChargeInputSchema,
  formatLocalAmount,
  getLocalMethod,
  getOfferedLocalMethods,
  roundForCurrency,
  xpagProductDescription,
} from "./xpag";

test("rounds COP to whole pesos and MXN/BRL to 2 decimals", () => {
  strictEqual(roundForCurrency(9.9, 4321.45, "COP"), 42782);
  strictEqual(roundForCurrency(9.9, 20.123, "MXN"), 199.22);
  strictEqual(roundForCurrency(9.9, 5.812, "BRL"), 57.54);
});

test("formats local currencies with the expected prefixes", () => {
  strictEqual(formatLocalAmount(199.22, "MXN"), "MX$ 199,22");
  strictEqual(formatLocalAmount(42782, "COP"), "CO$ 42.782,00");
  strictEqual(formatLocalAmount(57.54, "BRL"), "R$ 57,54");
});

test("sends DEG Guia do Dimas as the product name to XPag", () => {
  strictEqual(xpagProductDescription("5.600"), "DEG Guia do Dimas - 5.600 Diamantes");
  strictEqual(xpagProductDescription("56.000"), "DEG Guia do Dimas - 56.000 Diamantes");
});

test("enforces OXXO min and max limits", () => {
  const oxxo = getLocalMethod("OXXO");
  strictEqual(oxxo.minAmount, 10);
  strictEqual(oxxo.maxAmount, 10000);
});

test("validates customer name, email, package, and payment method", () => {
  const valid = createChargeInputSchema.safeParse({
    name: "Maria Silva",
    email: "maria@exemplo.com",
    priceKey: "15",
    method: "NEQUI",
    quoteToken: "test-quote",
  });
  strictEqual(valid.success, true);

  const invalidEmail = createChargeInputSchema.safeParse({
    name: "Maria Silva",
    email: "nao-e-email",
    priceKey: "15",
    method: "NEQUI",
    quoteToken: "test-quote",
  });
  strictEqual(invalidEmail.success, false);
});

test("hides Pix from offered local methods even when BRL is enabled in account balances", () => {
  const offered = getOfferedLocalMethods(["MXN", "COP", "BRL"]).map((m) => m.id);
  strictEqual(offered.includes("PIX"), false);
  strictEqual(offered.includes("OXXO"), true);
  strictEqual(offered.includes("NEQUI"), true);
  strictEqual(offered.includes("BREB"), true);
});