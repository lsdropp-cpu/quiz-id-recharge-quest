import { describe, test, expect } from "bun:test";
import {
  rechargePackages,
  rechargePrice,
  rechargeCents,
  formatRechargePrice,
} from "./recharge-packages";

describe("Spanish recharge prices", () => {
  test("the 56.000 diamond pack is 35 USD, charged as 3500 cents", () => {
    const pack = rechargePackages.find((p) => p.diamonds === "56.000");
    expect(pack.key).toBe("35");
    expect(rechargePrice("35")).toBe(35);
    expect(rechargeCents("35")).toBe(3500);
    expect(formatRechargePrice(rechargePrice("35"))).toBe("$35.00");
  });

  test("no pack shows a price different from the amount charged", () => {
    for (const pack of rechargePackages) {
      expect(pack.cents).toBe(Math.round(pack.priceUsd * 100));
    }
  });

  test("all six packs use the requested USD prices", () => {
    expect(rechargePackages.map((p) => p.priceUsd)).toEqual([9.90, 15.90, 19.90, 25.00, 29.90, 35.00]);
  });
});
